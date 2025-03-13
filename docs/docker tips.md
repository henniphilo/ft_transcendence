# about docker

if the cocker file copies files into the container when building it is not enough to rebuild when editing the files... the image needs to be removed and rebuilt, like this

first remove the image
```bash

docker rmi backend
```

then rebuild the image

```bash
docker compose up -d --force-recreate backend
```

## so many names tags and hashes. where are the images?

```bash
docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Names}}\t{{.Ports}}\t{{.Status}}"
```

if 
```bash
c4c1c1% docker rmi ft_transcendence-backend 
Error response from daemon: conflict: unable to remove repository reference "ft_transcendence-backend" (must force) - container cffdf2e751e2 is using its referenced image d38d16faef2a
```

then stop the container
```bash
c4c1c1% docker stop cffdf2e751e2
cffdf2e751e2
```

then remove
```bash
docker rm cffdf2e751e2
```
then remove the image
```bash
docker rmi ft_transcendence-backend
```
