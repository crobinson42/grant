
# JWT Example

## Install

```bash
$ cd examples/jwt
$ npm install
```

## OAuth

1. Create OAuth application for Facebook:
  - Settings -> Basic:
    - App Domains: `dummy.com`
    - Add Platform -> Website: `http://dummy.com`
  - Facebook Login -> Settings:
    - Valid OAuth Redirect URIs: `http://dummy.com:3000/connect/facebook/callback`

2. Edit your `hosts` file and add this line: `127.0.0.1 dummy.com`


## Config

Add your OAuth app credentials in `config.json`.


## Create self-signed certificates

```bash
# generate private key
openssl genrsa 2048 > private.pem
# generate the self signed certificate
openssl req -x509 -new -key private.pem -out public.pem
```

## Start

```bash
$ node app.js
```

## Login

- Navigate to `http://dummy.com:3000/connect/facebook` in your browser
