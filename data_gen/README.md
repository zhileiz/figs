# Example Usage: Remote Work Example

Let's generate some synthetic data for a remote work example.

## Data Generation
```bash
pip install pandas faker
python remote_work.py --scale 2000
```
You will get 12 CSV files in the current directory. You will need to upload all of them to the "Sources" page later.

## Create Ontology
Go to the "Schema" page, open the "Schema Assistant" and input the following prompt:
```md
Create a node type "Person" with id, name, age, gender, and role. ID being a number.
Create a node type "Workspace" with id, uuid, address, and capacity. ID being a number.
Create a node type "Company" with id, name, industry, and size. ID being a number.
Create a node type "City" with id and name. ID being a number.
Create a node type "Amenity" with id and name. ID being a number.
Create a node type "Provider" with id and name. ID being a number.
Person goes to a workspace. Person lives in a city. Person works for a company.
Workspace has amenities. Workspace is in a city. Provider provides workspace.
```

## Upload Data and Ingest
Upload all CSV files generated to the "Sources" page.
For each source, click the "help me ingest" button (or type "Ingest the file please" in the prompt box) to build the graph.

## Playground
You can now ask questions about the graph. For example:

## Access API
You can now access the API of the graph at `https://{your-domain-or-ip}/api/external/openai` and use the chat completion API to ask questions about the graph. 