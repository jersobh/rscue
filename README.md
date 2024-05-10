# API Service

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

### Built With

- Node.js - The runtime server environment
- Express - The web framework used
- SQLite3 - Database engine

### Authors

jersobh
