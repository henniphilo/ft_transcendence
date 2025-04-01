# github actions

you can insatall the github actions vscode extension in your local machine to test the workflow. Also try to run the compose file locally... it might not work because of the secrets though..

```bash
``` 
docker compose -f docker-compose.ci.yml up -d --build
docker compose logs
```


## errors
### .env not found 
I do specify the in the compose to use the .env.ci file but the gh actions still gives me errors like
```bash

```
The error message indicates that Docker Compose is looking for a `.env` file by default, even though you've specified `.env.ci` in your `env_file` sections. This is happening because Docker Compose has two different ways of handling environment variables:

1. The `env_file` directive you're using loads variables into the container's environment
2. The `.env` file (by default) is used to substitute variables in your `docker-compose.yml` file itself

## Solution

You need to explicitly tell Docker Compose to use your `.env.ci` file for both purposes. Here's how to fix it:

### 1. Modify your GitHub Actions workflow

Change your Docker Compose command to specify the env file:

```yaml
- name: Build and run Docker Compose
  run: |
    docker compose --env-file .env.ci -f docker-compose.ci.yml up -d --build
```

### 2. Alternative approach: Create the .env file

Since you're already defining all the variables in your workflow's `env` section, you could also create the `.env` file dynamically:

```yaml
- name: Create .env file
  run: |
    echo "LOG_HOST=${LOG_HOST}" >> .env
    echo "POSTGRES_USER=${POSTGRES_USER}" >> .env
    echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}" >> .env
    # Add all other required variables
    cat .env
```

### 3. Or combine both approaches

```yaml
- name: Build and run Docker Compose
  run: |
    # Create .env.ci file from secrets
    echo "LOG_HOST=logstash" > .env.ci
    echo "POSTGRES_USER=${{ secrets.POSTGRES_USER }}" >> .env.ci
    echo "POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }}" >> .env.ci
    # Add all other variables...
    
    docker compose --env-file .env.ci -f docker-compose.ci.yml up -d --build
```

## Why this happens

The warning messages about `LOG_HOST` not being set are occurring because Docker Compose is trying to substitute `${LOG_HOST}` in your compose file before the containers start, and it's not finding it in the default `.env` file. The `env_file` directive only makes the variables available inside the container, not during the compose file parsing phase.

By using `--env-file`, you ensure the variables are available for both:
1. Variable substitution in the compose file itself
2. Environment variables inside the containers

## Recommendation

For your CI/CD pipeline, I recommend explicitly creating the `.env.ci` file in your workflow as shown in option 3 above, as it gives you the most control and visibility into what environment variables are being set.