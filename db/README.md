

### Database startup
```
docker-compose up -d
```

### Database inspection
```
$ docker exec -it erderpladsihavnen_db bash
# psql -U pihuser -d pladsihavnen
\dt
\d markers
\d harbors
```
### docker kommandoer
```
docker --version
docker run hello-world
docker ps
docker container prune -f
docker stop <container name>
docker rm <container name>
sudo systemctl status docker

Konfiguration:
dockerfile

docker-compose --version
docker-compose up --build
docker-compose up --build backend
docker-compose up -d backend
docker-compose down
docker-compose down -v --remove-orphans
docker-compose stop backend

Konfiguration:
docker-compose.yml

sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

Konfigurations fil ??
/etc/docker/daemon.json

```

### Nyt database layout
docker-compose down -v --rmi all
docker ps -a
docker stop erderpladsihavnen_db
docker rm erderpladsihavnen_db
docker volume rm erpladsihavnen_data
docker volume ls
docker volume inspect <volume_name>
docker volume rm <volume_name>

docker images
docker rmi <image id>

### Når der er kludder i det
docker-compose down --volumes --remove-orphans
docker volume prune
docker network prune
docker image prune
docker images -f "dangling=true"

### Fejlsøgning
docker-compose logs backend
docker run --rm -v /etc/ssl/unisoft:/test busybox ls /test
docker run --rm -v /etc/unisoft/config:/test busybox ls -la /test

Når man får denne fejl:
  KeyError: 'ContainerConfig'
  [920566] Failed to execute script docker-compose
Så prøv med den her:
  docker rm 9dee25b9c5ac   # <--- container id eller navn


### Flyt til produktion
Du kan gemme dine images som tar-arkiver ved hjælp af docker save kommandoen:

Bash

docker save -o mit-express-app.tar mit-express-app:v1.0.0
docker save -o erderpladsihavnen_db.tar erderpladsihavnen_db:v1.0.0

    Overfør derefter tar-arkiverne til produktionsmaskinen (f.eks. via SCP, FTP eller en USB-nøgle).
    På produktionsmaskinen kan du indlæse images fra tar-arkiverne ved hjælp af docker load kommandoen:

Bash

docker load -i mit-express-app.tar
docker load -i erderpladsihavnen_db.tar


## Importer havne
Havne kan importeres fra filen havne.txt vha. programmmet import_havne.py