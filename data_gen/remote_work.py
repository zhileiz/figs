import pandas as pd
import random
from faker import Faker
import uuid
import argparse
from collections import Counter

# Fixed lists
amenity_names = [
    "coffee machine", "meeting room", "meeting booth", "monitors",
    "printer", "scanner", "whiteboard", "projector", "kitchen", "lounge area"
]
provider_names = ["WeWork", "Regus", "Spaces", "Knotel", "Industrious"]
city_names = [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
    "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
    "Austin", "Jacksonville", "San Francisco", "Columbus", "Indianapolis",
    "Seattle", "Denver", "Boston", "Nashville", "Portland"
]
industries = [
    "Tech", "Finance", "Healthcare", "Education", "Manufacturing",
    "Retail", "Transportation", "Energy", "Media", "Hospitality"
]
roles = [
    "Engineer", "Manager", "Analyst", "Designer", "Developer",
    "Consultant", "Sales", "Marketing", "HR", "Operations"
]

# Initialize Faker for realistic names
faker = Faker()

def main(scale):
    # Calculate number of entities
    N_people = scale
    N_companies = max(1, int(N_people / 10))
    N_cities = 20  # Fixed number of cities as per user feedback
    N_workspaces = max(1, int(N_people / 20))
    N_amenities = 10
    N_providers = 5

    # --- Generate Nodes ---

    # Amenities
    amenities = pd.DataFrame({
        "id": range(N_amenities),
        "name": amenity_names
    })

    # Providers
    providers = pd.DataFrame({
        "id": range(N_providers),
        "name": provider_names
    })

    # Cities
    cities = pd.DataFrame({
        "id": range(N_cities),
        "name": city_names
    })

    # Companies (size will be updated later)
    companies = pd.DataFrame({
        "id": range(N_companies),
        "name": [f"Company{i+1}" for i in range(N_companies)],
        "industry": [random.choice(industries) for _ in range(N_companies)],
        "size": [0] * N_companies
    })

    # Workspaces
    workspaces = pd.DataFrame({
        "id": range(N_workspaces),
        "uuid": [str(uuid.uuid4()) for _ in range(N_workspaces)],
        "address": [f"Address{i+1}" for i in range(N_workspaces)],
        "capacity": [random.randint(10, 100) for _ in range(N_workspaces)]
    })

    # People
    people = pd.DataFrame({
        "id": range(N_people),
        "name": [faker.name() for _ in range(N_people)],
        "age": [random.randint(18, 65) for _ in range(N_people)],
        "gender": [random.choice(["male", "female"]) for _ in range(N_people)],
        "role": [random.choice(roles) for _ in range(N_people)]
    })

    # --- Generate Edges ---

    # Workspace IS_IN City
    is_in_edges = [(workspace_id, random.randint(0, N_cities - 1)) 
                   for workspace_id in range(N_workspaces)]

    # Provider PROVIDES Workspace
    provides_edges = [(random.randint(0, N_providers - 1), workspace_id) 
                      for workspace_id in range(N_workspaces)]

    # Workspace HAS Amenity (3-5 amenities per workspace)
    has_edges = []
    for workspace_id in range(N_workspaces):
        num_amenities = random.randint(3, 5)
        amenities_for_workspace = random.sample(range(N_amenities), num_amenities)
        for amenity_id in amenities_for_workspace:
            has_edges.append((workspace_id, amenity_id))

    # Person LIVES_IN City
    lives_in_edges = [(person_id, random.randint(0, N_cities - 1)) 
                      for person_id in range(N_people)]

    # Person GOES_TO Workspace (same city as LIVES_IN)
    workspaces_by_city = {city_id: [] for city_id in range(N_cities)}
    for workspace_id, city_id in is_in_edges:
        workspaces_by_city[city_id].append(workspace_id)
    
    goes_to_edges = []
    for person_id in range(N_people):
        city_id = lives_in_edges[person_id][1]
        if workspaces_by_city[city_id]:  # If there are workspaces in the city
            workspace_id = random.choice(workspaces_by_city[city_id])
        else:  # Fallback: assign a random workspace
            workspace_id = random.randint(0, N_workspaces - 1)
        goes_to_edges.append((person_id, workspace_id))

    # Person WORKS_FOR Company
    works_for_edges = [(person_id, random.randint(0, N_companies - 1)) 
                       for person_id in range(N_people)]

    # --- Update Company Sizes ---
    company_employee_counts = Counter(company_id for _, company_id in works_for_edges)
    companies["size"] = [company_employee_counts[company_id] 
                         for company_id in companies["id"]]

    # --- Write CSV Files ---

    # Nodes
    people.to_csv("NODES_Person.csv", index=False)
    companies.to_csv("NODES_Company.csv", index=False)
    cities.to_csv("NODES_City.csv", index=False)
    workspaces.to_csv("NODES_Workspace.csv", index=False)
    amenities.to_csv("NODES_Amenity.csv", index=False)
    providers.to_csv("NODES_Provider.csv", index=False)

    # Edges
    pd.DataFrame(works_for_edges, columns=["person_id", "company_id"]).to_csv(
        "EDGES_WORKS_FOR.csv", index=False)
    pd.DataFrame(lives_in_edges, columns=["person_id", "city_id"]).to_csv(
        "EDGES_LIVES_IN.csv", index=False)
    pd.DataFrame(goes_to_edges, columns=["person_id", "workspace_id"]).to_csv(
        "EDGES_GOES_TO.csv", index=False)
    pd.DataFrame(provides_edges, columns=["provider_id", "workspace_id"]).to_csv(
        "EDGES_PROVIDES.csv", index=False)
    pd.DataFrame(has_edges, columns=["workspace_id", "amenity_id"]).to_csv(
        "EDGES_HAS.csv", index=False)
    pd.DataFrame(is_in_edges, columns=["workspace_id", "city_id"]).to_csv(
        "EDGES_IS_IN.csv", index=False)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate network graph dataset")
    parser.add_argument("--scale", type=int, required=True, 
                        help="Approximate total number of nodes (e.g., 1000, 10000, 100000)")
    args = parser.parse_args()
    main(args.scale)