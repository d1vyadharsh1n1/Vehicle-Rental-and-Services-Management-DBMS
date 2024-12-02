import pandas as pd
import sys
import json
import pymysql
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error
                                
# Database connection function
def connect_to_mysql():
    try:
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='eniya1704',
            database='Vehicle_Rental',
            port=3306
        )
        # print("Connected to MySQL")
        return connection
    except pymysql.MySQLError as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# Load data from CSV file and train model
def train_model():
    # Load data from CSV file
    df = pd.read_csv("data.csv")

    # Preprocessing
    label_encoders = {}
    for column in ['AC_Type', 'Fuel', 'Fastag']:
        le = LabelEncoder()
        df[column] = le.fit_transform(df[column])
        label_encoders[column] = le

    # Features and target variable
    X = df.drop(columns=['Num', 'Rental_Amount', 'Variant'])
    y = df['Rental_Amount']

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train the model
    model = RandomForestRegressor(random_state=42)
    model.fit(X_train, y_train)

    # Predictions and evaluation
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    # print(f"Mean Absolute Error: {mae}")

    return model, label_encoders

# Fetch vehicle data from the database
def fetch_vehicle_data(vehicle_id):
    connection = connect_to_mysql()
    if connection is None:
        print("Connection failed.")
        return None

    query = "SELECT Seater, AC_Type, Fuel, Fastag, Distance, Yr FROM Vehicle WHERE Vehicle_ID = %s"
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, (vehicle_id,))
            result = cursor.fetchone()
            if result is None:
                print(f"No vehicle found with Vehicle_ID: {vehicle_id}")
                return None
            else:
                columns = ['Seater', 'AC_Type', 'Fuel', 'Fastag', 'Distance', 'Yr']
                vehicle_data = dict(zip(columns, result))
                #print(f"Fetched data: {vehicle_data}")
                return vehicle_data
    except pymysql.MySQLError as err:
        print(f"Error executing query: {err}")
        return None
    finally:
        connection.close()

# Preprocess the vehicle data
def preprocess_vehicle_data(vehicle_data, label_encoders):
    try:
        ac_encoded = label_encoders['AC_Type'].transform([vehicle_data['AC_Type']])[0]
        fuel_encoded = label_encoders['Fuel'].transform([vehicle_data['Fuel']])[0]
        fastag_encoded = label_encoders['Fastag'].transform([vehicle_data['Fastag']])[0]

        new_data = pd.DataFrame({
            "Seater": [vehicle_data['Seater']],
            "AC_Type": [ac_encoded],
            "Fuel": [fuel_encoded],
            "Fastag": [fastag_encoded],
            "Distance": [vehicle_data['Distance']],
            "Yr": [vehicle_data['Yr']]
        })
        #print(f"Preprocessed data: {new_data}")
        return new_data
    except KeyError as e:
        print(f"Error during preprocessing: {e}")
        return None

# Main function
def main():
    # Train the model
    model, label_encoders = train_model()

    # User input for vehicle ID
    if len(sys.argv) > 1:
        vehicle_id = sys.argv[1]
    else:
        print("Vehicle ID not provided as an argument.")
        return

    # Fetch vehicle data
    vehicle_data = fetch_vehicle_data(vehicle_id)
    if vehicle_data:
        user_df = preprocess_vehicle_data(vehicle_data, label_encoders)
        if user_df is not None:
            # Predicting rental amount
            predicted_rental = model.predict(user_df)
            predicted_value = predicted_rental[0]
            # print(f"Predicted Rental Amount: {predicted_rental[0]}",flush = True)
            print(predicted_rental[0])
    else:
        print("Could not fetch vehicle data for the given Vehicle_ID.")

if __name__ == "__main__":
    main()