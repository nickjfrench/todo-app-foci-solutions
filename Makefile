up:
	docker compose up --build

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

down:
	docker compose down

build:
	docker compose build

build-dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml build

test:
	docker compose -f docker-compose.yml -f docker-compose.test.yml up --abort-on-container-exit
