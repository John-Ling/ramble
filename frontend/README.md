## Ramble Frontend

Ramble's frontend uses  NextJS 15 , ShadCN UI and TailwindCSS V4

### Connecting to Backend
The frontend uses a Backend-For-Frontend design to ensure access tokens cannot be exposed in any way to the client even to developers. 
Access tokens however can be accessed in route handlers and that is how we retrieve access tokens to send to the backend.

To communicate with the backend, create a new route handler under the api/ route. 

### Authentication with NextAuth

NextAuth is used for handling authentication

## TODO

- Template support (i.e add a predefined or user defined text template for every new entry)
- Interface for enabling encryption and setting own encryption key
- Switching between colour themes via data-theme attribute (themes are already defined a react component and hook is all thats left to implement)
- Multi-language support (i.e Mandarin)
- Voice Input via VAPI 
- Markdown support
- Loading animations and better UI

- Fix UI with Upload Icon