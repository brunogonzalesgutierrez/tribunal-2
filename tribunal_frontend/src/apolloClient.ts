import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({
    uri: "http://localhost:8000/graphql/", // URL de tu backend
  }),
  cache: new InMemoryCache(),
});

export default client;