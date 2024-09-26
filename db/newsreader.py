from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from db_connection import connect_db
from dotenv import load_dotenv
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext, Document
from llama_index.core.node_parser import SimpleNodeParser
from langchain_openai import ChatOpenAI
# from llama_index.storage.storage_context import StorageContext
# from llama_index.vector_stores.postgres import PGVectorStore
import os
import psycopg2
import requests
from serpapi import GoogleSearch
import warnings
from config import *
from datetime import datetime
from dateutil.relativedelta import relativedelta

warnings.filterwarnings("ignore", message="Field \"model_name\" in HuggingFaceInferenceAPIEmbeddings has conflict with protected namespace \"model_\".")


# Indlæs miljøvariabler fra .env filen
load_dotenv()

def get_harbors(number=200):
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("SELECT uuid, name FROM harbors")
    harbors = cur.fetchall()
    cur.close()
    conn.close()
    return harbors[:number]

def scrape_harbor_news(harbor_name):
    
    # Hent API-nøglen fra miljøvariablerne
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        raise ValueError("SERPAPI_API_KEY ikke fundet i miljøvariablerne")

    # Opsæt søgeparametre
    params = {
        "q": f"{harbor_name} havn nyheder",
        "location": "Denmark",
        "hl": "da",
        "gl": "dk",
        "google_domain": "google.dk",
        "api_key": api_key
    }

    # Udfør søgningen
    try:
      search = GoogleSearch(params)
      results = search.get_dict()
      print(f"Results: {results}")

      news_items = []

      # Behandl organiske søgeresultater
      for result in results.get("organic_results", []):
          title = result.get("title", "")
          link = result.get("link", "")
          snippet = result.get("snippet", "")
          news_items.append((title, link, snippet))

      # Behandl nyhedsresultater, hvis tilgængelige
      for news in results.get("news_results", []):
          title = news.get("title", "")
          link = news.get("link", "")
          snippet = news.get("snippet", "")
          news_items.append((title, link, snippet))
    except Exception as e:
      print(f"Error {e}")

    return news_items



def process_news_with_llama(news_items):
    
    # Opret en streng med nyhederne i stedet for en fil
    news_text = ""
    for title, link, description in news_items:
        news_text += f"{title}\n{description}\n\n"

    # Opret et Document objekt
    document = Document(text=news_text)

    # Opret en simpel node parser
    parser = SimpleNodeParser()

    # Parse dokumentet til nodes
    nodes = parser.get_nodes_from_documents([document])

    # Opret indeks fra nodesO # Opret en OpenAI LLM instans
    llm = ChatOpenAI(model=MODEL, temperature=0)
    
    index = VectorStoreIndex(nodes, llm)
    today = datetime.now().date() - relativedelta(months=3)

    # Generer et resumé
    query_engine = index.as_query_engine()
    summary = query_engine.query(
      f"""
        Giv et kort resumé af de vigtigste kommende begivenheder i havnen,
        der er relevante for sejlere, og som finder sted EFTER {today}.
        Inkluder kun begivenheder, der ligger i fremtiden.
        Hvis der ikke er nogen kommende begivenheder, så angiv det.
      """
    )
    print(f"Summary: {summary}")

    # Forsøg at ekstrahere datoer
    date_query = query_engine.query(
      """
        Find datoer for kommende begivenheder nævnt i nyhederne.
        Returner kun datoer, der ligger i fremtiden, i formatet YYYY-MM-DD.
        Hvis der ikke er nogen datoer, returner 'Ingen datoer fundet'.
      """
      )
    print(f"Date query: {date_query}")

    return str(summary), str(date_query)

def save_to_db(harbor_uuid, content, dates):
    future_dates = []
    current_date = datetime.now().date() - relativedelta(months=3)
    print(f"Date: {dates}")
    print(f"content {content}")
    if not ("ingen" in dates.lower() or "Der er ingen kommende begivenheder" in dates.lower()):
        extracted_dates = dates.split(', ')  # Assuming dates are comma-separated
        print(f"Extracted dates {extracted_dates}")
        for date_str in extracted_dates:
            event_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            if event_date > current_date:
                future_dates.append(event_date)

    print(f"Future dates {future_dates}")
    if future_dates:
      print("Saving data to the database")
      try:
          conn = connect_db()
          cur = conn.cursor()

          cur.execute(
              "INSERT INTO harbor_info (harbor_uuid, date, content) VALUES (%s, %s, %s)",
            (harbor_uuid, current_date, content)
          )
          conn.commit() 
      except psycopg2.errors.UniqueViolation as e:
          print(f"Unique constraint violation: {e}")
          # Handle the case where you're trying to insert a duplicate record

      except psycopg2.Error as e:
          print(f"Database error: {e}")
          conn.rollback()  # Roll back the transaction in case of an error

      except  Exception as e:
        print(f"An error occurred while saving to the database: {e}")
        
      finally:
        if conn:
            print("close db")
            cur.close()
            conn.close()  # Sørg for at lukke forbindelse

if __name__ == "__main__":
    harbors = get_harbors(3)
    
    for harbor_uuid, harbor_name in harbors:
        print(f"Behandler nyheder for {harbor_name}")
        news_items = scrape_harbor_news(harbor_name)
        
        if news_items:
            summary, dates = process_news_with_llama(news_items)
            save_to_db(harbor_uuid, summary, dates)
            print()
        else:
            print(f"Ingen nyheder fundet for {harbor_name}.")