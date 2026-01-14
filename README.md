# Smart Invoicing System - BitBuilders Hackathon

This project is a simple, yet very useful invoicing system created for the BitBuilders Hackathon. It's a full-stack application built with Next.js, Tailwind CSS, and Supabase.

## How It Works

The application is a Next.js project structured with a clear separation of concerns, utilizing a microservice architecture with distinct roles for different users.

1.  **Frontend:** The UI is built with React and Next.js. It uses Tailwind CSS for styling. The application is a single-page app with client-side routing between the different sections.
2.  **Backend (BaaS):** Supabase serves as the Backend-as-a-Service.
3.  **Database Schema:** The database consists of three tables: `categories`, `invoices`, and `invoice_items`.
4.  **PDF Generation:** The application can generate PDF invoices on the fly using the `jsPDF` and `jspdf-autotable` libraries. The PDF is generated entirely on the client-side.

## Custom Feature

The custom feature added to this project is a **Sales Analytics Dashboard** on the Admin page. This dashboard provides the administrator with a real-time overview of the business's performance by displaying key metrics:

-   **Total Revenue:** The sum of all completed transactions.
-   **Total Invoices:** The total number of invoices created.
-   **Sales by Category:** A breakdown of sales, showing which categories are generating the most revenue and selling the most items.

This feature provides valuable insights that can help in making business decisions.

## How to Set Up and Run

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Supabase:**
    -   Create a new project on [Supabase](https://supabase.com/).
    -   Go to the "SQL Editor" and run the contents of the `schema.sql` file to create the necessary tables and policies. For this project I have disable the rls policy in my supabase tables.
    -   Go to "Project Settings" > "API" and find your Project URL and `anon` key.
4.  **Configure environment variables:**
    -   Rename the `.env.local.example` file to `.env.local`.
    -   Replace the placeholder values for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your actual Supabase credentials.
5.  **Run the development server:**
    ```bash
    npm run dev
    ```
6.  **Open your browser** to `http://localhost:3000` to see the application.

## Submitting for the Hackathon

-   **Source Code:** The code is in this repository.
-   **Output Screenshot/Demo:** You can take screenshots of the Admin, Cashier, and History pages to showcase the functionality.
-   **Explanation:** This `README.md` file serves as the explanation.
-   **Custom Feature:** The "Sales Dashboard" is the custom feature, as described above.
