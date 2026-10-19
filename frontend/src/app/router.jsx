import { createBrowserRouter } from "react-router-dom";

import StaffLayout from "../components/layout/StaffLayout";
import AppointmentDetails from "../pages/AppointmentDetails";
import Appointments from "../pages/Appointments";
import Availability from "../pages/Availability";
import Booking from "../pages/Booking";
import BookingConfirmation from "../pages/BookingConfirmation";
import MyAppointments from "../pages/MyAppointments";
import PublicClinicians from "../pages/PublicClinicians";
import PublicTreatments from "../pages/PublicTreatments";
import ClinicianDetails from "../pages/ClinicianDetails";
import Clinicians from "../pages/Clinicians";
import Dashboard from "../pages/Dashboard";
import Home from "../pages/Home";
import PatientDetails from "../pages/PatientDetails";
import Patients from "../pages/Patients";
import ScheduleCalendar from "../pages/ScheduleCalendar";
import Treatments from "../pages/Treatments";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  { path: "/treatments", element: <PublicTreatments /> },
  { path: "/clinicians", element: <PublicClinicians /> },
  { path: "/book", element: <Booking /> },
  { path: "/booking/confirmation", element: <BookingConfirmation /> },
  { path: "/my-appointments", element: <MyAppointments /> },
  {
    path: "/staff",
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
      {
        path: "appointments/:id",
        element: <AppointmentDetails />,
      },
      {
        path: "patients",
        element: <Patients />,
      },
      {
        path: "patients/:id",
        element: <PatientDetails />,
      },
      {
        path: "clinicians",
        element: <Clinicians />,
      },
      {
        path: "clinicians/:id",
        element: <ClinicianDetails />,
      },
      {
        path: "treatments",
        element: <Treatments />,
      },
      {
        path: "availability",
        element: <Availability />,
      },
      {
        path: "schedule",
        element: <ScheduleCalendar />,
      },
    ],
  },
]);
