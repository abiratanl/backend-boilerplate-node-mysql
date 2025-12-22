# Loads the variables from the .env file for use in the Makefile, if necessary.
include .env

.PHONY: help up down restart logs test seed shell db-shell clean

help: ## Display this help
	@@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start the containers in daemon mode and rebuild them if necessary.
	docker compose up -d --build

down: ## Stop and remove the containers.
	docker compose down

restart: ## Restart the API containers.
	docker compose restart api

logs: ## Displays API logs in real time.
	docker compose logs -f api

test: ## Run the Jest tests.
	npm test

seed: ## Creates the initial administrator user.
	npm run seed:admin

shell: ## Enter the API container terminal.
	docker exec -it $$(docker ps -qf "name=-api-") sh

db-shell: ## Access the MySQL terminal inside the container.
	docker exec -it $$(docker ps -qf "name=-db-") mysql -u root -p$(DB_PASSWORD)

clean: ## Clear node_modules, containers, and volumes (CAUTION!)
	docker compose down -v
	sudo rm -rf node_modules
	npm install

setup: up seed ## Full command: Starts Docker and creates the admin panel.
	@echo "🚀 Projeto configurado e rodando!"