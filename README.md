# ERDDAP Proxy API

Simple Node-Express API to fetch and process data from ERDDAP.

To install:
`npm install`

To run:
`npm run dev` (if trying to connect to a local telemetry or erddap instance, use `npm run dev:telemetry:local` or `npm run dev:erddap:local`, respectively)

Listening on: 
`localhost:8088`

Documentation:
`localhost:8088/api-docs`

Linting:
`npm run prettify`


## Buoy Telemetry

To connect to the buoy telemetry data, you'll need a `.env.dev` with the following.  Make a dump of the buoy data to load to a localhost mysql server and point the dev api to that.

```
BUOY_TELEMETRY_MYSQL_HOST=localhost
BUOY_TELEMETRY_MYSQL_USER=
BUOY_TELEMETRY_MYSQL_PASSWORD=
BUOY_TELEMETRY_MYSQL_DATABASE=buoy_telemetry
```

The built/deployed version uses the `.env` file with the same keys but with the service account.

## Production Deployment

The deployment lives on the RKE2 cluster `bked`. See https://github.com/brown-ccv/k8s-deploy-bke/tree/main/riddc-api for more info on the deployment and troubleshooting.

## Working with the Deployment

The RIDDC API is deployed to `bked` cluster on BKE. First set the context namespace with: `kubectx qbked` to test with the QA cluster.

**Navigate to the internal repository for Kubernetes.**

Verify that the `riddc-api` namespace is in the list by calling: `kubens`

Next activate the namespace with: `kubens riddc-api`

Check the deployment: `kubectl get deployments` should return `<qa>-riddc-api`

### Testing the MySQL connection to `delmyrsrchcit.service.brown.edu`

MySQL client gets installed as a sidecar in the QA deployment. This results in two different containers getting installed in the QA deployment pod: one for `riddc-api`, one for `mysql-client`. We can use the `mysql-client` container to test that our pod can connect to the database with the example code here.

1. `kubectl exec -it <qa pod id> -c mysql-client -- sh`
Inside the container, we should see a shell prompt. 

2. sh-5.1# `mysql -h delmypractcit.services.brown.edu -u svc_riddc_buoy_api -p`
Enter the password for the service account and then we'll see a new mysql prompt. This QA server hosts MySQL v8.4.7.

3. mysql> `SHOW DATABASES;`
   mysql> `use buoy_telemetry` #also test `hastings_breathe_pvd`
   mysql> `SHOW TABLES;`
   mysql> `SELECT * FROM `Buoy-620_MetData` LIMIT 10;`
This will send the head of this table to stdout.

4. If needed, test the connection to the production server in the same way, except use this connection: `mysql -h pelmypractcit.services.brown.edu -u svc_riddc_buoy_api -p`

#As of July 2026, this server hosts MySQL v8.4.7.


### Restarting the Deployment

After changes or updates to the servers (`delmypractcit`, `pelmypractcit`), the BKE cluster may need to be restarted. The real-time buoy page will be out of date compared to ERDDAP after changes on the servers. 

Check the server [site](https://erddap.riddc.brown.edu/erddap/tabledap/buoy_telemetry_0ffe_2dc0_916e.html) to see the latest date.
It should be four hours ahead of eastern time. 

Then check the map and table on the real-time buoy [page](https://data-explorer.riddc.brown.edu/dataset/buoy-telemetry/summary). The date should be four hours behind the date on ERDDAP. If not, the deployment needs to be restarted.

•   `kubectl get pods` should show the age of the last restart   
•   `kubectl rollout restart deployment/riddc-api` will restart the deployment

After deploying, check the front-end at `https://qa-api.riddc.brown.edu/api-docs/`. If everything looks good, proceed to deploy on `bked`, which deploys to `https://api.riddc.brown.edu/api-docs/`.

### Troubleshooting

•   `kubectl get pods`   
•   `kubectl logs <pod-id>`   
•   `kubectl describe pod [pod name]` – gets info on the deployment
•   `kubectl exec -it <pod-name> -- sh` – enters a terminal shell inside the pod for inspection