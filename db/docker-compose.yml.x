version: '3.8'

services:
  db:
    container_name: erderpladsihavnen_db
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - erderpladsihavnen_db:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  erderpladsihavnen_db: