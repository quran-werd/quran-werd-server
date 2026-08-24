# Project rules

- Whenever a change affects an API endpoint (new endpoint, changed route/method, changed request params/body, changed response shape, or changed behavior/semantics), update `Quran-Werd-API.postman_collection.json` in the same change: the request definition (method, URL, params/body), its `description`, and its test script (`event[].script.exec`) so they reflect the new behavior. Do this without being asked.
- If that change introduces or renames anything a request depends on via `{{variable}}` (base URL, tokens, ids, or any new environment-level value), also update `Quran-Werd-API.postman_environment.json` to add/rename/remove the matching variable. Do this without being asked.
