import { createBrowserRouter } from "react-router-dom";

import StaffLayout from "../components/layout/StaffLayout";
import AppointmentDetails from "../pages/AppointmentDetails";
import Appointments from "../pages/Appointments";
import Clinicians from "../pages/Clinicians";
import Dashboard from "../pages/Dashboard";
import Patients from "../pages/Patients";
export const router = createBrowserRouter([
  {
    path: "/",
    element: <StaffLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "appointments",
        element: <Appointments />,
      },
      { path: "appointments/:id", element: <AppointmentDetails /> },
      {
        path: "patients",
        element: <Patients />,
      },
      {
        path: "clinicians",
        element: <Clinicians />,
      },
    ],
  },
]);
