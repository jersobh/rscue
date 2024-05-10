# RScue - RScue is an app for helping to give aid to victms and help the rescue on catastrophes

This project provides an API service for managing alerts. It is containerized with Docker for easy setup and deployment.

<img src="https://raw.githubusercontent.com/jersobh/rscue/main/img/1.png" width=250 />
<img src="https://raw.githubusercontent.com/jersobh/rscue/main/img/2.png" width=250 />
<img src="https://raw.githubusercontent.com/jersobh/rscue/main/img/3.png" width=250 />
<img src="https://raw.githubusercontent.com/jersobh/rscue/main/img/4.png" width=250 />
<img src="https://raw.githubusercontent.com/jersobh/rscue/main/img/5.png" width=250 />
<img src="https://raw.githubusercontent.com/jersobh/rscue/main/img/6.png" width=250 />
<img src="https://raw.githubusercontent.com/jersobh/rscue/main/img/7.png" width=250 />

## Getting Started

These instructions will cover usage information and for the docker container

### Prerequisities

In order to run this container you'll need docker installed.

- [Get Docker](https://docs.docker.com/get-docker/)

### Usage

#### Container Parameters

List the different parameters available to your container

```shell
docker-compose up -d
```

This will start the service and expose the necessary ports.

#### Environment Variables

#### NODE_ENV

    - A Node.js runtime environment variable that specifies if the environment is production or development. Default is production.

#### Volumes

- /path/to/your/api/src: Mount point for the source code of the API.
- /path/to/your/api/node_modules: Persistent storage for Node.js modules.

#### API Endpoints

- The service runs by default at http://localhost:3000.

### Add an Alert

You can add an alert by making a POST request to /alerts with the required data:

```shell
curl -X POST http://localhost:3000/alerts -H "Content-Type: application/json" -d '{
"lat": -23.55052,
"lng": -46.633308,
"event_name": "Road Block",
"type": "road-block",
"description": "A road block is reported",
"tags": ["accident", "block"],
"contact_number": "1122334455"
}'
```

### Get All Alerts

##### Retrieve all alerts with a GET request:

```shell
curl http://localhost:3000/alerts
```

### Other alert examples

#### alert-red

```shell
curl -X POST http://localhost:3000/alerts -H "Content-Type: application/json" -d '{
"lat": -30.0277,
"lng": -51.2287,
"event_name": "Alerta Vermelho",
"type": "alert-red",
"description": "Emergência devido a inundação",
"tags": ["emergência", "inundação"],
"contact_number": "99887766"
}'
```

#### ambulance

```shell
curl -X POST http://localhost:3000/alerts -H "Content-Type: application/json" -d '{
"lat": -26.3044,
"lng": -48.8456,
"event_name": "Ambulância Necessária",
"type": "ambulance",
"description": "Acidente grave necessitando ambulância",
"tags": ["acidente", "urgente"],
"contact_number": "99887755"
}'
```

#### blocked

```shell
curl -X POST http://localhost:3000/alerts -H "Content-Type: application/json" -d '{
"lat": -25.4284,
"lng": -49.2733,
"event_name": "Rua Bloqueada",
"type": "blocked",
"description": "Árvore caída bloqueando a rua",
"tags": ["obstrução", "árvore caída"],
"contact_number": "99886644"
}'
```

#### missing-person

```shell
curl -X POST http://localhost:3000/alerts -H "Content-Type: application/json" -d '{
"lat": -29.6842,
"lng": -53.8069,
"event_name": "Pessoa Desaparecida",
"type": "missing-person",
"description": "Menino desaparecido de 10 anos",
"tags": ["desaparecido", "criança"],
"contact_number": "99885533"
}'
```

#### road-block

```shell
curl -X POST http://localhost:3000/alerts -H "Content-Type: application/json" -d '{
"lat": -27.5969,
"lng": -48.5495,
"event_name": "Bloqueio na Estrada",
"type": "road-block",
"description": "Construção causando bloqueio na estrada principal",
"tags": ["construção", "bloqueio"],
"contact_number": "99884422"
}'
```

#### warning-red-yellow

```shell
curl -X POST http://localhost:3000/alerts -H "Content-Type: application/json" -d '{
"lat": -28.2620,
"lng": -52.4067,
"event_name": "Atenção: Perigo de Deslizamento",
"type": "warning-red-yellow",
"description": "Alerta de deslizamento nas encostas próximas",
"tags": ["alerta", "deslizamento"],
"contact_number": "99883311"
}'
```

#### alert

```shell
curl -X POST http://localhost:3000/alerts -H "Content-Type: application/json" -d '{
"lat": -26.9206,
"lng": -49.0661,
"event_name": "Alerta Geral",
"type": "alert",
"description": "Teste de sistema de alerta público",
"tags": ["teste", "sirene"],
"contact_number": "99882200"
}'
```

#### atention

```shell
curl -X POST http://localhost:3000/alerts -H "Content-Type: application/json" -d '{
"lat": -25.5013,
"lng": -54.5786,
"event_name": "Atenção no Local",
"type": "atention",
"description": "Área de alto risco de acidente",
"tags": ["precaução", "acidente"],
"contact_number": "998811
```

### Built With

- Node.js - The runtime server environment
- Express - The web framework used
- SQLite3 - Database engine

### Authors

jersobh
