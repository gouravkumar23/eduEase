import firebase_admin
from firebase_admin import credentials, auth, firestore
import os

# Using the specific service account file found in the project
SERVICE_ACCOUNT_FILE = "friendproject1-a2973-firebase-adminsdk-fbsvc-ad5a59c4e4.json"

try:
    cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Error: Could not initialize Firebase. Ensure {SERVICE_ACCOUNT_FILE} is present.")
    exit(1)

def delete_collection(coll_ref, batch_size=500):
    """Deletes a collection in batches for much better performance."""
    docs = coll_ref.limit(batch_size).stream()
    deleted = 0

    batch = db.batch()
    for doc in docs:
        batch.delete(doc.reference)
        deleted = deleted + 1

    if deleted > 0:
        batch.commit()
        print(f"   Deleted {deleted} documents...")

    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)

def reset_database():
    print("--- WARNING: THIS WILL DELETE ALL DATA ---")
    confirm = input("Type 'DELETE' to confirm: ")
    if confirm != "DELETE":
        print("Aborted.")
        return

    print("\n1. Deleting Firestore Collections...")
    # Get all root collections
    collections = db.collections()
    for coll in collections:
        print(f"   Processing collection: {coll.id}")
        delete_collection(coll)

    print("\n2. Deleting Auth Users...")
    # Delete users in batches of 1000 (Firebase limit)
    users_page = auth.list_users()
    while users_page:
        uids = [user.uid for user in users_page.users]
        if uids:
            auth.delete_users(uids)
            print(f"   Deleted {len(uids)} auth users...")
        
        # Get next page
        if users_page.has_next_page:
            users_page = users_page.get_next_page()
        else:
            break

    print("\n3. Creating New Admin Account...")
    email = "admin1@gmail.com"
    password = "123456"
    
    try:
        new_user = auth.create_user(
            email=email,
            password=password,
            display_name="System Admin",
            email_verified=True
        )
        
        # Create Firestore record
        db.collection('users').document(new_user.uid).set({
            "name": "System Admin",
            "role": "admin",
            "status": "active",
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        print(f"\nSUCCESS: Admin created with email: {email}")
    except Exception as e:
        print(f"\nError creating admin: {e}")

if __name__ == "__main__":
    reset_database()