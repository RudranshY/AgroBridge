
AgroBridge
AgroBridge is a comprehensive web platform designed to facilitate wholesale crop trading, connecting farmers and buyers in an intuitive and efficient marketplace. With separate interfaces for sellers and consumers, it streamlines the process of buying and selling crops while providing valuable features for both parties.

Deployed Links
Frontend (Client): https://agrobridge.vercel.app/

Backend (Server): https://agrobridge-server.vercel.app/

Features
Dual Interfaces
AgroBridge provides separate interfaces for consumers and sellers, accessible through the navbar with options for SignUp and SignIn. Account creation requires manual verification from an administrator (via MongoDB Compass) for enhanced security.

Seller Side
Visualizing Sales Data: Incorporates Recharts (graphs) to create insightful visualizations of sales data.

Product Management: Sellers can easily add products, including images, details, location via map selection (Leaflet), current stock, and minimum order quantity (MOQ) restrictions. Products can be edited and deleted.

Order Management: Sellers have access to a dashboard displaying order requests, including order location coordinates on a map.

FAQ Section: Sellers can address common inquiries about their products through a dedicated FAQ section visible to consumers.

CropSense AI: Powered by Gemini AI, this tool helps predict optimal crops based on given parameters.

Consumer Side
User-Friendly Consumer Interface: Consumers can browse various categories and products conveniently from the homepage.

Detailed Product Dashboard: Product details, including stock availability and MOQ, are displayed prominently. Users can add products to their cart directly.

Review System: Users can leave reviews for products, enhancing transparency and trust.

Contact Farmer Form: A contact form allows users to inquire about products directly. Answered queries become part of the FAQ section. It also features a map showing the product's location.

Dynamic Cart Functionality: Users can manage product quantities in the cart, with limitations based on MOQ and available stock.

Seamless Checkout: The checkout process allows users to review orders (including delivery charges), select delivery locations via a map, and place orders securely.

Real-Time Stock Updates (WebSocket): Implemented socket.io to provide real-time stock updates. Users can see live changes in stock availability without reloading the page.

Technologies Used
MongoDB (Database)

Node.js & Express.js (Backend)

React.js (Frontend)

Redux (State Management)

Tailwind CSS (Styling)

WebSocket (socket.io) (Real-time features)

Cloudinary (Image storage)

Leaflet (Interactive maps)

Recharts (Data visualization)

Gemini AI (AI-powered predictions)

Installation
To run AgroBridge locally, ensure you have Node.js and MongoDB installed.

Clone the repository:

Bash

git clone https://github.com/RudranshY/AgroBridge.git
cd AgroBridge
Frontend Setup (client):

Navigate to the client folder.

Create a .env file in the root of the client folder.

Add the following environment variables:

Code snippet

# For running with your local backend
VITE_AGROBRIDGE_API="http://localhost:8080/"
VITE_SOCKET_URL="http://localhost:8080"

# --- OR ---

# For running with your deployed backend
# VITE_AGROBRIDGE_API="https://agrobridge-server.vercel.app/"
# VITE_SOCKET_URL="https://agrobridge-server.vercel.app"
Install dependencies and run the client:

Bash

cd client
npm install
npm run dev
Backend Setup (server):

Navigate to the server folder.

Create a .env file in the root of the server folder.

Add the following environment variables:

Code snippet

MONGO_DB_URL={your_mongodb_connection_string}
JWT_SECRET={your_long_random_jwt_secret}

PORT=8080
ALLOWED_ORIGINS=http://localhost:5173

# API Keys
GEMINI_API_KEY={your_google_gemini_api_key}
CLOUDINARY_CLOUD_NAME={your_cloudinary_cloud_name}
CLOUDINARY_API_KEY={your_cloudinary_api_key}
CLOUDINARY_API_SECRET={your_cloudinary_api_secret}
Install dependencies and run the server:

Bash

cd server
npm install
npx nodemon
