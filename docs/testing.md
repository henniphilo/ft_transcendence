# testing

Lets create a testing strategy and CI/CD pipeline for our Docker Compose project.  
We can break this down into multiple parts.


```yaml
name: ft_transcendence_test

x-common: &common
  env_file:
    - .env.test
  networks:
    - transcendence_test_network
  init: true

services:
  postgres_test:
    <<: *common
    image: "postgres:16"
    environment:
      - POSTGRES_DB=test_db
      - POSTGRES_USER=test_user
      - POSTGRES_PASSWORD=test_password
    tmpfs: 
      - /var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis_test:
    <<: *common
    image: "redis:alpine"
    ports:
      - "6381:6379"
    command: redis-server --save ""
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend_test:
    <<: *common
    build: 
      context: src/ft_transcendence_backend
      target: test
    depends_on:
      postgres_test:
        condition: service_healthy
      redis_test:
        condition: service_healthy
    environment:
      - POSTGRES_HOST=postgres_test
      - REDIS_HOST=redis_test
      - TESTING=true
    command: >
      sh -c "pytest --cov=. --cov-report=xml -v"

  game_test:
    <<: *common
    build: 
      context: src/ft_transcendence_backend/game
      target: test
    command: pytest --cov=. --cov-report=xml -v

networks:
  transcendence_test_network:
    name: transcendence_test_network
    driver: bridge

```

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Create env file
        run: |
          echo "POSTGRES_DB=test_db" >> .env.test
          echo "POSTGRES_USER=test_user" >> .env.test
          echo "POSTGRES_PASSWORD=test_password" >> .env.test
          echo "REDIS_URL=redis://redis_test:6379/0" >> .env.test

      - name: Run tests
        run: docker compose -f docker-compose.test.yml up --build --exit-code-from backend_test

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
          fail_ci_if_error: true

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push images
        run: |
          docker compose build
          docker compose push

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            cd /path/to/project
            git pull
            docker compose pull
            docker compose up -d

```

Here's how to implement a comprehensive testing strategy for your project:

1. Test Environment Setup:
- Created a separate `docker-compose.test.yml` for testing
- Uses tmpfs for Postgres to speed up tests
- Disables Redis persistence for faster testing
- Sets up test-specific networks and ports

2. Testing Best Practices:
- Use pytest for Python testing
- Implement coverage reporting
- Separate test environment variables
- Health checks for dependent services
- Fast cleanup with tmpfs volumes

3. Backend Testing Structure:
Create the following structure in your backend service:

```
src/ft_transcendence_backend/
├── tests/
│   ├── conftest.py       # pytest fixtures
│   ├── unit/            # unit tests
│   ├── integration/     # integration tests
│   └── e2e/             # end-to-end tests
```

4. CI/CD Pipeline Features:
- Runs on push to main/develop and PRs
- Separate jobs for testing, building, and deployment
- Automated coverage reporting
- Docker image building and pushing
- Production deployment for main branch

5. Security Considerations:
- Separate test credentials
- Use of GitHub secrets for sensitive data
- No production credentials in test environment

To implement this:

1. Create `.env.test` file for test environment variables
2. Save the provided Docker Compose test configuration as `docker-compose.test.yml`
3. Save the GitHub workflow as `.github/workflows/ci-cd.yml`
4. Add necessary secrets to your GitHub repository:
   - DOCKERHUB_USERNAME
   - DOCKERHUB_TOKEN
   - DEPLOY_HOST
   - DEPLOY_USER
   - DEPLOY_KEY

To run tests locally:
```bash
docker compose -f docker-compose.test.yml up --build
```

## managing secrets on github
To add the necessary secrets to your GitHub repository, follow these steps:

### Steps to Add Secrets to GitHub Repository

1. **Navigate to Your Repository:**
   - Go to your GitHub repository on the GitHub website.

2. **Go to Settings:**
   - Click on the `Settings` tab at the top of the repository page.

3. **Access Secrets:**
   - In the left sidebar, click on `Secrets and variables` under the `Security` section.
   - Click on `Actions` to manage secrets for GitHub Actions.

4. **Add New Secrets:**
   - Click on the `New repository secret` button.
   - Add the following secrets one by one:

### Secrets to Add

1. **DOCKERHUB_USERNAME:**
   - **Name:** `DOCKERHUB_USERNAME`
   - **Value:** Your Docker Hub username

2. **DOCKERHUB_TOKEN:**
   - **Name:** `DOCKERHUB_TOKEN`
   - **Value:** Your Docker Hub access token or password

3. **DEPLOY_HOST:**
   - **Name:** `DEPLOY_HOST`
   - **Value:** The hostname or IP address of your deployment server

4. **DEPLOY_USER:**
   - **Name:** `DEPLOY_USER`
   - **Value:** The username for SSH access to your deployment server

5. **DEPLOY_KEY:**
   - **Name:** `DEPLOY_KEY`
   - **Value:** The private SSH key for accessing your deployment server (make sure to format it correctly, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines)

### Example

Here’s how to add a secret:

1. **Click on `New repository secret`.**
2. **Enter the name and value for the secret.**
   - **Name:** `DOCKERHUB_USERNAME`
   - **Value:** `your-dockerhub-username`
3. **Click `Add secret`.**

Repeat these steps for each of the secrets listed above.

### Summary

By following these steps, you can add the necessary secrets to your GitHub repository. These secrets will be securely stored and can be accessed by your GitHub Actions workflows to perform tasks such as logging into Docker Hub and deploying to your production server.