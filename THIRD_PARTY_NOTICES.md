# Third-party notices

The Studio source patch is based on [Supabase](https://github.com/supabase/supabase), commit `79964102d369991a3b3adda27dc1f528c3a77457`. Original source and our modifications are distributed under Apache-2.0; see [LICENSE](LICENSE) and [NOTICE](NOTICE).

The dependency overlays and Monaco Russian catalog include modifications or translated material from the following MIT-licensed projects. Their original copyright and permission notices are preserved in `licenses/`.

| Component | Pinned version | License notice |
| --- | --- | --- |
| Monaco Editor | 0.52.2 | [Microsoft notice](licenses/monaco-editor-LICENSE.txt) |
| GraphiQL | 5.2.2 | [GraphQL Contributors notice](licenses/graphiql-LICENSE.txt) |
| @graphiql/react | 0.37.3 | [GraphQL Contributors notice](licenses/@graphiql_react-LICENSE.txt) |
| @graphiql/plugin-doc-explorer | 0.4.1 | [GraphQL Contributors notice](licenses/@graphiql_plugin-doc-explorer-LICENSE.txt) |
| @graphiql/plugin-history | 0.4.1 | [GraphQL Contributors notice](licenses/@graphiql_plugin-history-LICENSE.txt) |
| Sonner | 1.5.0 | [Emil Kowalski notice](licenses/sonner-LICENSE.txt) |
| Streamdown | 1.3.0 | [Vercel notice](licenses/streamdown-LICENSE.txt) |

The two GraphiQL plugin npm packages declare MIT and share the GraphiQL monorepo's license; its notice is included for each plugin.

The Docker build downloads upstream dependencies and Google Fonts (Inter, Manrope, Source Code Pro). Their existing notices and licenses remain applicable to a built image. Font binaries and the complete dependency tree are not redistributed in this source repository. The build embeds fonts for local browser delivery through Next.js.
