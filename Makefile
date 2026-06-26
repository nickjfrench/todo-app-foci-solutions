start:
	docker compose up --build

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

down:
	docker compose down

build:
	docker compose build

build-no-cache:
	docker compose build --no-cache

build-dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml build

build-dev-no-cache:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache

test:
	docker compose -f docker-compose.yml -f docker-compose.test.yml up --abort-on-container-exit
