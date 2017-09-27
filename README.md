# sample-koa-skeleton

An opinionated skeleton for how to structure a Koa REST API with a MSSQL backend.

## Features

* Cache (In-Memory)
* Sessions (via stateful JWT)
* Hashicorp Vault Integration
* Logger
* Docker ready

## Description
Note this isn't meant to be a working app in the sense that it can be installed and ran as is. It depends on backend services like Hashicorp Vault and MSSQL as well as a database to connect to.
 The code is heavily commented, start in [app.js](https://github.com/mhingston/sample-koa-skeleton/blob/master/app.js). 
