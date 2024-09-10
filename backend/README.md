
# backend

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn dev
yarn start
```

### Compiles and minifies for production
```
yarn build
```

# Certificates

## self signed
openssl req -nodes -new -x509 -keyout server.key -out server.cert

## Lets Encrypt
$ sudo certbot certonly --manual --preferred-challenges dns -d unisoft.dk
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Requesting a certificate for unisoft.dk

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Please deploy a DNS TXT record under the name:

_acme-challenge.unisoft.dk.

with the following value:

ktHeDYA_k0LNGeHaMgTlJZM6FqRELFiBz0pZHTJ5oMc

Before continuing, verify the TXT record has been deployed. Depending on the DNS
provider, this may take some time, from a few seconds to multiple minutes. You can
check if it has finished deploying with aid of online tools, such as the Google
Admin Toolbox: https://toolbox.googleapps.com/apps/dig/#TXT/_acme-challenge.unisoft.dk.
Look for one or more bolded line(s) below the line ';ANSWER'. It should show the
value(s) you've just added.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Press Enter to Continue

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/unisoft.dk/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/unisoft.dk/privkey.pem
This certificate expires on 2024-12-02.
These files will be updated when the certificate renews.

NEXT STEPS:
- This certificate will not be renewed automatically. Autorenewal of --manual certificates requires the use of an authentication hook script (--manual-auth-hook) but one was not provided. To renew this certificate, repeat this same certbot command before the certificate's expiry date.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
If you like Certbot, please consider supporting our work by:
 * Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
 * Donating to EFF:                    https://eff.org/donate-le
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
