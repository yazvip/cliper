# AUTO CLIPPER - Makefile for VPS
.PHONY: install dev worker build up down logs backup update status

install:
	sudo ./install.sh

dev:
	docker compose up -d postgres redis
	npx prisma migrate dev
	npm run dev

worker:
	npm run worker

build:
	docker compose -f docker-compose.prod.yml build

up:
	docker compose -f docker-compose.prod.yml up -d

down:
	docker compose -f docker-compose.prod.yml down

logs:
	docker compose -f docker-compose.prod.yml logs -f --tail=100

backup:
	./scripts/backup.sh

update:
	git pull
	docker compose -f docker-compose.prod.yml build app worker
	docker compose -f docker-compose.prod.yml up -d
	docker compose -f docker-compose.prod.yml exec -T app npx prisma migrate deploy

status:
	./autoclipper status

health:
	curl -s http://localhost:3000/api/health | jq

ps:
	docker compose -f docker-compose.prod.yml ps
