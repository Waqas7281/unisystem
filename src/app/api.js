import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "Users",
    "Students",
    "Fees",
    "Applications",
    "Notifications",
    "Semesters",
    "AcademicRecords",
    "CustomFields",
    "Letters",
    "Staff",
    "StaffApplications",
    "StaffLeaves",
  ],
  endpoints: (builder) => ({
    // ---- Auth ----
    login: builder.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),

    // ---- Dashboard ----
    getDashboardSummary: builder.query({
      query: () => "/dashboard/summary",
    }),

    // ---- Users ----
    getUsers: builder.query({
      query: () => "/users",
      providesTags: ["Users"],
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),
    toggleBlockUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}/toggle-block`, method: "PATCH" }),
      invalidatesTags: ["Users"],
    }),

    // ---- Students ----
    // Accepts either a plain search string (legacy) or a filters object, e.g.
    // { search, category, mine, missingMatric, missingInter, missingDegreeSession, program }
    getStudents: builder.query({
      query: (params) => {
        const filters =
          typeof params === "string" ? { search: params } : params || {};
        const qs = new URLSearchParams(
          Object.entries(filters).filter(
            ([, v]) => v !== undefined && v !== null && v !== "",
          ),
        ).toString();
        return `/students${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Students"],
    }),
    getStudentByEnrollment: builder.query({
      query: (enrollmentNumber) =>
        `/students/by-enrollment/${enrollmentNumber}`,
      providesTags: ["Students"],
    }),
    getStudent: builder.query({
      query: (id) => `/students/${id}`,
      providesTags: ["Students"],
    }),
    createStudent: builder.mutation({
      query: (body) => ({ url: "/students", method: "POST", body }),
      invalidatesTags: ["Students"],
    }),
    updateStudent: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/students/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Students"],
    }),
    deleteStudent: builder.mutation({
      query: (id) => ({ url: `/students/${id}`, method: "DELETE" }),
      invalidatesTags: ["Students"],
    }),
    importStudentsExcel: builder.mutation({
      query: (formData) => ({
        url: "/students/import-excel",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Students", "CustomFields"],
    }),
    getStudentCustomFields: builder.query({
      query: () => "/students/custom-fields",
      providesTags: ["CustomFields"],
    }),

    // ---- Semesters ----
    getSemesters: builder.query({
      query: (studentId) => `/semesters/student/${studentId}`,
      providesTags: ["Semesters"],
    }),
    generateSemesters: builder.mutation({
      query: ({ studentId, startYear, startType }) => ({
        url: `/semesters/student/${studentId}/generate`,
        method: "POST",
        body: startType ? { startYear, startType } : { startYear },
      }),
      invalidatesTags: ["Semesters"],
    }),
    extendSemesters: builder.mutation({
      query: (studentId) => ({
        url: `/semesters/student/${studentId}/extend`,
        method: "POST",
      }),
      invalidatesTags: ["Semesters"],
    }),

    // ---- Clearance Slips ----
    searchClearanceStudent: builder.query({
      query: (enrollmentNumber) =>
        `/clearance/search?enrollmentNumber=${encodeURIComponent(enrollmentNumber)}`,
    }),
    generateClearanceSlip: builder.mutation({
      query: (body) => ({
        url: "/clearance/generate",
        method: "POST",
        body,
      }),
    }),
    verifyClearanceToken: builder.mutation({
      query: (token) => ({
        url: `/clearance/verify/${encodeURIComponent(token)}`,
        method: "POST",
      }),
    }),

    // ---- Fees ----
    getStudentFees: builder.query({
      query: (studentId) => `/fees/student/${studentId}`,
      providesTags: ["Fees"],
    }),
    addFee: builder.mutation({
      query: (body) => ({ url: "/fees", method: "POST", body }),
      invalidatesTags: ["Fees"],
    }),
    updateFee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/fees/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Fees"],
    }),
    updateFeeStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/fees/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Fees"],
    }),
    getFeeCustomFields: builder.query({
      query: () => "/fees/custom-fields?appliesTo=Fee",
      providesTags: ["CustomFields"],
    }),
    createFeeCustomField: builder.mutation({
      query: (body) => ({ url: "/fees/custom-fields", method: "POST", body }),
      invalidatesTags: ["CustomFields"],
    }),
    updateFeeCustomField: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/fees/custom-fields/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CustomFields", "Fees"],
    }),
    deleteFeeCustomField: builder.mutation({
      query: (id) => ({ url: `/fees/custom-fields/${id}`, method: "DELETE" }),
      invalidatesTags: ["CustomFields"],
    }),
    importFeesExcel: builder.mutation({
      query: (formData) => ({
        url: "/fees/import-excel",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Fees", "CustomFields"],
    }),

    // ---- Applications ----
    getApplications: builder.query({
      query: (search) => `/applications${search ? `?search=${search}` : ""}`,
      providesTags: ["Applications"],
    }),
    getPendingApplications: builder.query({
      query: () => "/applications/pending",
      providesTags: ["Applications"],
    }),
    getApplication: builder.query({
      query: (id) => `/applications/${id}`,
      providesTags: ["Applications"],
    }),
    createApplication: builder.mutation({
      query: (body) => ({ url: "/applications", method: "POST", body }),
      invalidatesTags: ["Applications"],
    }),
    addApplicationAction: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/applications/${id}/actions`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Applications", "Fees"],
    }),
    assignApplication: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/applications/${id}/assign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Applications"],
    }),
    markApplicationDone: builder.mutation({
      query: (id) => ({ url: `/applications/${id}/mark-done`, method: "POST" }),
      invalidatesTags: ["Applications"],
    }),
    decideApplication: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/applications/${id}/decide`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Applications"],
    }),

    // ---- Notifications ----
    getNotifications: builder.query({
      query: () => "/notifications",
      providesTags: ["Notifications"],
    }),
    getUnreadCount: builder.query({
      query: () => "/notifications/unread-count",
      providesTags: ["Notifications"],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({ url: "/notifications/mark-all-read", method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),

    // ---- Academic Records ----
    getAcademicRecords: builder.query({
      query: (enrollmentNumber) =>
        `/academic-records/by-enrollment/${enrollmentNumber}`,
      providesTags: ["AcademicRecords"],
    }),
    getAcademicRecordsByStudent: builder.query({
      query: (studentId) => `/academic-records/by-student/${studentId}`,
      providesTags: ["AcademicRecords"],
    }),
    getRecordRoomDashboard: builder.query({
      query: () => "/academic-records/dashboard-summary",
      providesTags: ["AcademicRecords", "Students"],
    }),
    createAcademicRecord: builder.mutation({
      query: (body) => ({ url: "/academic-records", method: "POST", body }),
      invalidatesTags: ["AcademicRecords", "Students"],
    }),
    updateAcademicRecord: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/academic-records/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AcademicRecords", "Students"],
    }),
    deleteAcademicRecord: builder.mutation({
      query: (id) => ({ url: `/academic-records/${id}`, method: "DELETE" }),
      invalidatesTags: ["AcademicRecords", "Students"],
    }),

    // ---- Letters (Record Room) ----
    getLettersByStudent: builder.query({
      query: (studentId) => `/letters/by-student/${studentId}`,
      providesTags: ["Letters"],
    }),
    createLetter: builder.mutation({
      query: (body) => ({ url: "/letters", method: "POST", body }),
      invalidatesTags: ["Letters"],
    }),
    updateLetter: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/letters/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Letters"],
    }),
    deleteLetter: builder.mutation({
      query: (id) => ({ url: `/letters/${id}`, method: "DELETE" }),
      invalidatesTags: ["Letters"],
    }),

    // ---- HR ----
    getStaff: builder.query({
      query: (params) => {
        const qs = new URLSearchParams(
          Object.entries(params || {}).filter(
            ([, v]) => v !== undefined && v !== null && v !== "",
          ),
        ).toString();
        return `/hr/staff${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Staff"],
    }),
    getStaffMember: builder.query({
      query: (id) => `/hr/staff/${id}`,
      providesTags: ["Staff"],
    }),
    createStaff: builder.mutation({
      query: (body) => ({ url: "/hr/staff", method: "POST", body }),
      invalidatesTags: ["Staff"],
    }),
    updateStaff: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/hr/staff/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Staff"],
    }),
    deleteStaff: builder.mutation({
      query: (id) => ({ url: `/hr/staff/${id}`, method: "DELETE" }),
      invalidatesTags: ["Staff"],
    }),
    getHrDashboardSummary: builder.query({
      query: () => "/hr/dashboard-summary",
      providesTags: ["Staff"],
    }),
    getStaffApplications: builder.query({
      query: (staffId) => `/hr/staff/${staffId}/applications`,
      providesTags: ["StaffApplications"],
    }),
    createStaffApplication: builder.mutation({
      query: (body) => ({ url: "/hr/applications", method: "POST", body }),
      invalidatesTags: ["StaffApplications"],
    }),
    updateStaffApplication: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/hr/applications/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["StaffApplications"],
    }),
    deleteStaffApplication: builder.mutation({
      query: (id) => ({ url: `/hr/applications/${id}`, method: "DELETE" }),
      invalidatesTags: ["StaffApplications"],
    }),
    getStaffLeaves: builder.query({
      query: (staffId) => `/hr/staff/${staffId}/leaves`,
      providesTags: ["StaffLeaves"],
    }),
    upsertStaffLeave: builder.mutation({
      query: (body) => ({ url: "/hr/leaves", method: "POST", body }),
      invalidatesTags: ["StaffLeaves"],
    }),
  }),
});

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetDashboardSummaryQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleBlockUserMutation,
  useGetStudentsQuery,
  useGetStudentByEnrollmentQuery,
  useLazyGetStudentByEnrollmentQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useImportStudentsExcelMutation,
  useGetStudentCustomFieldsQuery,
  useGetSemestersQuery,
  useGenerateSemestersMutation,
  useExtendSemestersMutation,
  useGetStudentFeesQuery,
  useAddFeeMutation,
  useUpdateFeeMutation,
  useUpdateFeeStatusMutation,
  useGetFeeCustomFieldsQuery,
  useCreateFeeCustomFieldMutation,
  useUpdateFeeCustomFieldMutation,
  useDeleteFeeCustomFieldMutation,
  useImportFeesExcelMutation,
  useGetApplicationsQuery,
  useGetPendingApplicationsQuery,
  useGetApplicationQuery,
  useCreateApplicationMutation,
  useAddApplicationActionMutation,
  useAssignApplicationMutation,
  useMarkApplicationDoneMutation,
  useDecideApplicationMutation,
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetAcademicRecordsQuery,
  useLazyGetAcademicRecordsQuery,
  useGetAcademicRecordsByStudentQuery,
  useGetRecordRoomDashboardQuery,
  useCreateAcademicRecordMutation,
  useUpdateAcademicRecordMutation,
  useDeleteAcademicRecordMutation,
  useGetLettersByStudentQuery,
  useCreateLetterMutation,
  useUpdateLetterMutation,
  useDeleteLetterMutation,
  useGetStaffQuery,
  useGetStaffMemberQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useGetHrDashboardSummaryQuery,
  useGetStaffApplicationsQuery,
  useCreateStaffApplicationMutation,
  useUpdateStaffApplicationMutation,
  useDeleteStaffApplicationMutation,
  useGetStaffLeavesQuery,
  useUpsertStaffLeaveMutation,
  useLazySearchClearanceStudentQuery,
  useGenerateClearanceSlipMutation,
  useVerifyClearanceTokenMutation,
} = api;
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "Users",
    "Students",
    "Fees",
    "Applications",
    "Notifications",
    "Semesters",
    "AcademicRecords",
    "CustomFields",
    "Letters",
    "Staff",
    "StaffApplications",
    "StaffLeaves",
  ],
  endpoints: (builder) => ({
    // ---- Auth ----
    login: builder.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),

    // ---- Dashboard ----
    getDashboardSummary: builder.query({
      query: () => "/dashboard/summary",
    }),

    // ---- Users ----
    getUsers: builder.query({
      query: () => "/users",
      providesTags: ["Users"],
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),
    toggleBlockUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}/toggle-block`, method: "PATCH" }),
      invalidatesTags: ["Users"],
    }),

    // ---- Students ----
    // Accepts either a plain search string (legacy) or a filters object, e.g.
    // { search, category, mine, missingMatric, missingInter, missingDegreeSession, program }
    getStudents: builder.query({
      query: (params) => {
        const filters =
          typeof params === "string" ? { search: params } : params || {};
        const qs = new URLSearchParams(
          Object.entries(filters).filter(
            ([, v]) => v !== undefined && v !== null && v !== "",
          ),
        ).toString();
        return `/students${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Students"],
    }),
    getStudentByEnrollment: builder.query({
      query: (enrollmentNumber) =>
        `/students/by-enrollment/${enrollmentNumber}`,
      providesTags: ["Students"],
    }),
    getStudent: builder.query({
      query: (id) => `/students/${id}`,
      providesTags: ["Students"],
    }),
    createStudent: builder.mutation({
      query: (body) => ({ url: "/students", method: "POST", body }),
      invalidatesTags: ["Students"],
    }),
    updateStudent: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/students/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Students"],
    }),
    deleteStudent: builder.mutation({
      query: (id) => ({ url: `/students/${id}`, method: "DELETE" }),
      invalidatesTags: ["Students"],
    }),
    importStudentsExcel: builder.mutation({
      query: (formData) => ({
        url: "/students/import-excel",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Students", "CustomFields"],
    }),
    getStudentCustomFields: builder.query({
      query: () => "/students/custom-fields",
      providesTags: ["CustomFields"],
    }),

    // ---- Semesters ----
    getSemesters: builder.query({
      query: (studentId) => `/semesters/student/${studentId}`,
      providesTags: ["Semesters"],
    }),
    generateSemesters: builder.mutation({
      query: ({ studentId, startYear, startType }) => ({
        url: `/semesters/student/${studentId}/generate`,
        method: "POST",
        body: startType ? { startYear, startType } : { startYear },
      }),
      invalidatesTags: ["Semesters"],
    }),
    extendSemesters: builder.mutation({
      query: (studentId) => ({
        url: `/semesters/student/${studentId}/extend`,
        method: "POST",
      }),
      invalidatesTags: ["Semesters"],
    }),

    // ---- Clearance Slips ----
    searchClearanceStudent: builder.query({
      query: (enrollmentNumber) =>
        `/clearance/search?enrollmentNumber=${encodeURIComponent(enrollmentNumber)}`,
    }),
    generateClearanceSlip: builder.mutation({
      query: (body) => ({
        url: "/clearance/generate",
        method: "POST",
        body,
      }),
    }),
    verifyClearanceToken: builder.mutation({
      query: (token) => ({
        url: `/clearance/verify/${encodeURIComponent(token)}`,
        method: "POST",
      }),
    }),

    // ---- Fees ----
    getStudentFees: builder.query({
      query: (studentId) => `/fees/student/${studentId}`,
      providesTags: ["Fees"],
    }),
    addFee: builder.mutation({
      query: (body) => ({ url: "/fees", method: "POST", body }),
      invalidatesTags: ["Fees"],
    }),
    updateFee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/fees/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Fees"],
    }),
    updateFeeStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/fees/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Fees"],
    }),
    getFeeCustomFields: builder.query({
      query: () => "/fees/custom-fields?appliesTo=Fee",
      providesTags: ["CustomFields"],
    }),
    createFeeCustomField: builder.mutation({
      query: (body) => ({ url: "/fees/custom-fields", method: "POST", body }),
      invalidatesTags: ["CustomFields"],
    }),
    updateFeeCustomField: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/fees/custom-fields/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CustomFields", "Fees"],
    }),
    deleteFeeCustomField: builder.mutation({
      query: (id) => ({ url: `/fees/custom-fields/${id}`, method: "DELETE" }),
      invalidatesTags: ["CustomFields"],
    }),
    importFeesExcel: builder.mutation({
      query: (formData) => ({
        url: "/fees/import-excel",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Fees", "CustomFields"],
    }),

    // ---- Applications ----
    getApplications: builder.query({
      query: (search) => `/applications${search ? `?search=${search}` : ""}`,
      providesTags: ["Applications"],
    }),
    getPendingApplications: builder.query({
      query: () => "/applications/pending",
      providesTags: ["Applications"],
    }),
    getApplication: builder.query({
      query: (id) => `/applications/${id}`,
      providesTags: ["Applications"],
    }),
    createApplication: builder.mutation({
      query: (body) => ({ url: "/applications", method: "POST", body }),
      invalidatesTags: ["Applications"],
    }),
    addApplicationAction: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/applications/${id}/actions`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Applications", "Fees"],
    }),
    assignApplication: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/applications/${id}/assign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Applications"],
    }),
    markApplicationDone: builder.mutation({
      query: (id) => ({ url: `/applications/${id}/mark-done`, method: "POST" }),
      invalidatesTags: ["Applications"],
    }),
    decideApplication: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/applications/${id}/decide`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Applications"],
    }),

    // ---- Notifications ----
    getNotifications: builder.query({
      query: () => "/notifications",
      providesTags: ["Notifications"],
    }),
    getUnreadCount: builder.query({
      query: () => "/notifications/unread-count",
      providesTags: ["Notifications"],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({ url: "/notifications/mark-all-read", method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),

    // ---- Academic Records ----
    getAcademicRecords: builder.query({
      query: (enrollmentNumber) =>
        `/academic-records/by-enrollment/${enrollmentNumber}`,
      providesTags: ["AcademicRecords"],
    }),
    getAcademicRecordsByStudent: builder.query({
      query: (studentId) => `/academic-records/by-student/${studentId}`,
      providesTags: ["AcademicRecords"],
    }),
    getRecordRoomDashboard: builder.query({
      query: () => "/academic-records/dashboard-summary",
      providesTags: ["AcademicRecords", "Students"],
    }),
    createAcademicRecord: builder.mutation({
      query: (body) => ({ url: "/academic-records", method: "POST", body }),
      invalidatesTags: ["AcademicRecords", "Students"],
    }),
    updateAcademicRecord: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/academic-records/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AcademicRecords", "Students"],
    }),
    deleteAcademicRecord: builder.mutation({
      query: (id) => ({ url: `/academic-records/${id}`, method: "DELETE" }),
      invalidatesTags: ["AcademicRecords", "Students"],
    }),

    // ---- Letters (Record Room) ----
    getLettersByStudent: builder.query({
      query: (studentId) => `/letters/by-student/${studentId}`,
      providesTags: ["Letters"],
    }),
    createLetter: builder.mutation({
      query: (body) => ({ url: "/letters", method: "POST", body }),
      invalidatesTags: ["Letters"],
    }),
    updateLetter: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/letters/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Letters"],
    }),
    deleteLetter: builder.mutation({
      query: (id) => ({ url: `/letters/${id}`, method: "DELETE" }),
      invalidatesTags: ["Letters"],
    }),

    // ---- HR ----
    getStaff: builder.query({
      query: (params) => {
        const qs = new URLSearchParams(
          Object.entries(params || {}).filter(
            ([, v]) => v !== undefined && v !== null && v !== "",
          ),
        ).toString();
        return `/hr/staff${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Staff"],
    }),
    getStaffMember: builder.query({
      query: (id) => `/hr/staff/${id}`,
      providesTags: ["Staff"],
    }),
    createStaff: builder.mutation({
      query: (body) => ({ url: "/hr/staff", method: "POST", body }),
      invalidatesTags: ["Staff"],
    }),
    updateStaff: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/hr/staff/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Staff"],
    }),
    deleteStaff: builder.mutation({
      query: (id) => ({ url: `/hr/staff/${id}`, method: "DELETE" }),
      invalidatesTags: ["Staff"],
    }),
    getHrDashboardSummary: builder.query({
      query: () => "/hr/dashboard-summary",
      providesTags: ["Staff"],
    }),
    getStaffApplications: builder.query({
      query: (staffId) => `/hr/staff/${staffId}/applications`,
      providesTags: ["StaffApplications"],
    }),
    createStaffApplication: builder.mutation({
      query: (body) => ({ url: "/hr/applications", method: "POST", body }),
      invalidatesTags: ["StaffApplications"],
    }),
    updateStaffApplication: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/hr/applications/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["StaffApplications"],
    }),
    deleteStaffApplication: builder.mutation({
      query: (id) => ({ url: `/hr/applications/${id}`, method: "DELETE" }),
      invalidatesTags: ["StaffApplications"],
    }),
    getStaffLeaves: builder.query({
      query: (staffId) => `/hr/staff/${staffId}/leaves`,
      providesTags: ["StaffLeaves"],
    }),
    upsertStaffLeave: builder.mutation({
      query: (body) => ({ url: "/hr/leaves", method: "POST", body }),
      invalidatesTags: ["StaffLeaves"],
    }),
  }),
});

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetDashboardSummaryQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleBlockUserMutation,
  useGetStudentsQuery,
  useGetStudentByEnrollmentQuery,
  useLazyGetStudentByEnrollmentQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useImportStudentsExcelMutation,
  useGetStudentCustomFieldsQuery,
  useGetSemestersQuery,
  useGenerateSemestersMutation,
  useExtendSemestersMutation,
  useGetStudentFeesQuery,
  useAddFeeMutation,
  useUpdateFeeMutation,
  useUpdateFeeStatusMutation,
  useGetFeeCustomFieldsQuery,
  useCreateFeeCustomFieldMutation,
  useUpdateFeeCustomFieldMutation,
  useDeleteFeeCustomFieldMutation,
  useImportFeesExcelMutation,
  useGetApplicationsQuery,
  useGetPendingApplicationsQuery,
  useGetApplicationQuery,
  useCreateApplicationMutation,
  useAddApplicationActionMutation,
  useAssignApplicationMutation,
  useMarkApplicationDoneMutation,
  useDecideApplicationMutation,
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetAcademicRecordsQuery,
  useLazyGetAcademicRecordsQuery,
  useGetAcademicRecordsByStudentQuery,
  useGetRecordRoomDashboardQuery,
  useCreateAcademicRecordMutation,
  useUpdateAcademicRecordMutation,
  useDeleteAcademicRecordMutation,
  useGetLettersByStudentQuery,
  useCreateLetterMutation,
  useUpdateLetterMutation,
  useDeleteLetterMutation,
  useGetStaffQuery,
  useGetStaffMemberQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useGetHrDashboardSummaryQuery,
  useGetStaffApplicationsQuery,
  useCreateStaffApplicationMutation,
  useUpdateStaffApplicationMutation,
  useDeleteStaffApplicationMutation,
  useGetStaffLeavesQuery,
  useUpsertStaffLeaveMutation,
  useLazySearchClearanceStudentQuery,
  useGenerateClearanceSlipMutation,
  useVerifyClearanceTokenMutation,
} = api;
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "Users",
    "Students",
    "Fees",
    "Applications",
    "Notifications",
    "Semesters",
    "AcademicRecords",
    "CustomFields",
    "Letters",
    "Staff",
    "StaffApplications",
    "StaffLeaves",
  ],
  endpoints: (builder) => ({
    // ---- Auth ----
    login: builder.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),

    // ---- Dashboard ----
    getDashboardSummary: builder.query({
      query: () => "/dashboard/summary",
    }),

    // ---- Users ----
    getUsers: builder.query({
      query: () => "/users",
      providesTags: ["Users"],
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),
    toggleBlockUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}/toggle-block`, method: "PATCH" }),
      invalidatesTags: ["Users"],
    }),

    // ---- Students ----
    // Accepts either a plain search string (legacy) or a filters object, e.g.
    // { search, category, mine, missingMatric, missingInter, missingDegreeSession, program }
    getStudents: builder.query({
      query: (params) => {
        const filters =
          typeof params === "string" ? { search: params } : params || {};
        const qs = new URLSearchParams(
          Object.entries(filters).filter(
            ([, v]) => v !== undefined && v !== null && v !== "",
          ),
        ).toString();
        return `/students${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Students"],
    }),
    getStudentByEnrollment: builder.query({
      query: (enrollmentNumber) =>
        `/students/by-enrollment/${enrollmentNumber}`,
      providesTags: ["Students"],
    }),
    getStudent: builder.query({
      query: (id) => `/students/${id}`,
      providesTags: ["Students"],
    }),
    createStudent: builder.mutation({
      query: (body) => ({ url: "/students", method: "POST", body }),
      invalidatesTags: ["Students"],
    }),
    updateStudent: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/students/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Students"],
    }),
    deleteStudent: builder.mutation({
      query: (id) => ({ url: `/students/${id}`, method: "DELETE" }),
      invalidatesTags: ["Students"],
    }),
    importStudentsExcel: builder.mutation({
      query: (formData) => ({
        url: "/students/import-excel",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Students", "CustomFields"],
    }),
    getStudentCustomFields: builder.query({
      query: () => "/students/custom-fields",
      providesTags: ["CustomFields"],
    }),

    // ---- Semesters ----
    getSemesters: builder.query({
      query: (studentId) => `/semesters/student/${studentId}`,
      providesTags: ["Semesters"],
    }),
    generateSemesters: builder.mutation({
      query: ({ studentId, startYear, startType }) => ({
        url: `/semesters/student/${studentId}/generate`,
        method: "POST",
        body: startType ? { startYear, startType } : { startYear },
      }),
      invalidatesTags: ["Semesters"],
    }),
    extendSemesters: builder.mutation({
      query: (studentId) => ({
        url: `/semesters/student/${studentId}/extend`,
        method: "POST",
      }),
      invalidatesTags: ["Semesters"],
    }),

    // ---- Clearance Slips ----
    searchClearanceStudent: builder.query({
      query: (enrollmentNumber) =>
        `/clearance/search?enrollmentNumber=${encodeURIComponent(enrollmentNumber)}`,
    }),
    generateClearanceSlip: builder.mutation({
      query: (body) => ({
        url: "/clearance/generate",
        method: "POST",
        body,
      }),
    }),
    verifyClearanceToken: builder.mutation({
      query: (token) => ({
        url: `/clearance/verify/${encodeURIComponent(token)}`,
        method: "POST",
      }),
    }),

    // ---- Fees ----
    getStudentFees: builder.query({
      query: (studentId) => `/fees/student/${studentId}`,
      providesTags: ["Fees"],
    }),
    addFee: builder.mutation({
      query: (body) => ({ url: "/fees", method: "POST", body }),
      invalidatesTags: ["Fees"],
    }),
    updateFee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/fees/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Fees"],
    }),
    updateFeeStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/fees/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Fees"],
    }),
    getFeeCustomFields: builder.query({
      query: () => "/fees/custom-fields?appliesTo=Fee",
      providesTags: ["CustomFields"],
    }),
    createFeeCustomField: builder.mutation({
      query: (body) => ({ url: "/fees/custom-fields", method: "POST", body }),
      invalidatesTags: ["CustomFields"],
    }),
    updateFeeCustomField: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/fees/custom-fields/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CustomFields", "Fees"],
    }),
    deleteFeeCustomField: builder.mutation({
      query: (id) => ({ url: `/fees/custom-fields/${id}`, method: "DELETE" }),
      invalidatesTags: ["CustomFields"],
    }),
    importFeesExcel: builder.mutation({
      query: (formData) => ({
        url: "/fees/import-excel",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Fees", "CustomFields"],
    }),

    // ---- Applications ----
    getApplications: builder.query({
      query: (search) => `/applications${search ? `?search=${search}` : ""}`,
      providesTags: ["Applications"],
    }),
    getPendingApplications: builder.query({
      query: () => "/applications/pending",
      providesTags: ["Applications"],
    }),
    getApplication: builder.query({
      query: (id) => `/applications/${id}`,
      providesTags: ["Applications"],
    }),
    createApplication: builder.mutation({
      query: (body) => ({ url: "/applications", method: "POST", body }),
      invalidatesTags: ["Applications"],
    }),
    addApplicationAction: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/applications/${id}/actions`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Applications", "Fees"],
    }),
    assignApplication: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/applications/${id}/assign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Applications"],
    }),
    markApplicationDone: builder.mutation({
      query: (id) => ({ url: `/applications/${id}/mark-done`, method: "POST" }),
      invalidatesTags: ["Applications"],
    }),
    decideApplication: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/applications/${id}/decide`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Applications"],
    }),

    // ---- Notifications ----
    getNotifications: builder.query({
      query: () => "/notifications",
      providesTags: ["Notifications"],
    }),
    getUnreadCount: builder.query({
      query: () => "/notifications/unread-count",
      providesTags: ["Notifications"],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({ url: "/notifications/mark-all-read", method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),

    // ---- Academic Records ----
    getAcademicRecords: builder.query({
      query: (enrollmentNumber) =>
        `/academic-records/by-enrollment/${enrollmentNumber}`,
      providesTags: ["AcademicRecords"],
    }),
    getAcademicRecordsByStudent: builder.query({
      query: (studentId) => `/academic-records/by-student/${studentId}`,
      providesTags: ["AcademicRecords"],
    }),
    getRecordRoomDashboard: builder.query({
      query: () => "/academic-records/dashboard-summary",
      providesTags: ["AcademicRecords", "Students"],
    }),
    createAcademicRecord: builder.mutation({
      query: (body) => ({ url: "/academic-records", method: "POST", body }),
      invalidatesTags: ["AcademicRecords", "Students"],
    }),
    updateAcademicRecord: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/academic-records/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AcademicRecords", "Students"],
    }),
    deleteAcademicRecord: builder.mutation({
      query: (id) => ({ url: `/academic-records/${id}`, method: "DELETE" }),
      invalidatesTags: ["AcademicRecords", "Students"],
    }),

    // ---- Letters (Record Room) ----
    getLettersByStudent: builder.query({
      query: (studentId) => `/letters/by-student/${studentId}`,
      providesTags: ["Letters"],
    }),
    createLetter: builder.mutation({
      query: (body) => ({ url: "/letters", method: "POST", body }),
      invalidatesTags: ["Letters"],
    }),
    updateLetter: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/letters/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Letters"],
    }),
    deleteLetter: builder.mutation({
      query: (id) => ({ url: `/letters/${id}`, method: "DELETE" }),
      invalidatesTags: ["Letters"],
    }),

    // ---- HR ----
    getStaff: builder.query({
      query: (params) => {
        const qs = new URLSearchParams(
          Object.entries(params || {}).filter(
            ([, v]) => v !== undefined && v !== null && v !== "",
          ),
        ).toString();
        return `/hr/staff${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Staff"],
    }),
    getStaffMember: builder.query({
      query: (id) => `/hr/staff/${id}`,
      providesTags: ["Staff"],
    }),
    createStaff: builder.mutation({
      query: (body) => ({ url: "/hr/staff", method: "POST", body }),
      invalidatesTags: ["Staff"],
    }),
    updateStaff: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/hr/staff/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Staff"],
    }),
    deleteStaff: builder.mutation({
      query: (id) => ({ url: `/hr/staff/${id}`, method: "DELETE" }),
      invalidatesTags: ["Staff"],
    }),
    getHrDashboardSummary: builder.query({
      query: () => "/hr/dashboard-summary",
      providesTags: ["Staff"],
    }),
    getStaffApplications: builder.query({
      query: (staffId) => `/hr/staff/${staffId}/applications`,
      providesTags: ["StaffApplications"],
    }),
    createStaffApplication: builder.mutation({
      query: (body) => ({ url: "/hr/applications", method: "POST", body }),
      invalidatesTags: ["StaffApplications"],
    }),
    updateStaffApplication: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/hr/applications/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["StaffApplications"],
    }),
    deleteStaffApplication: builder.mutation({
      query: (id) => ({ url: `/hr/applications/${id}`, method: "DELETE" }),
      invalidatesTags: ["StaffApplications"],
    }),
    getStaffLeaves: builder.query({
      query: (staffId) => `/hr/staff/${staffId}/leaves`,
      providesTags: ["StaffLeaves"],
    }),
    upsertStaffLeave: builder.mutation({
      query: (body) => ({ url: "/hr/leaves", method: "POST", body }),
      invalidatesTags: ["StaffLeaves"],
    }),
  }),
});

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetDashboardSummaryQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleBlockUserMutation,
  useGetStudentsQuery,
  useGetStudentByEnrollmentQuery,
  useLazyGetStudentByEnrollmentQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useImportStudentsExcelMutation,
  useGetStudentCustomFieldsQuery,
  useGetSemestersQuery,
  useGenerateSemestersMutation,
  useExtendSemestersMutation,
  useGetStudentFeesQuery,
  useAddFeeMutation,
  useUpdateFeeMutation,
  useUpdateFeeStatusMutation,
  useGetFeeCustomFieldsQuery,
  useCreateFeeCustomFieldMutation,
  useUpdateFeeCustomFieldMutation,
  useDeleteFeeCustomFieldMutation,
  useImportFeesExcelMutation,
  useGetApplicationsQuery,
  useGetPendingApplicationsQuery,
  useGetApplicationQuery,
  useCreateApplicationMutation,
  useAddApplicationActionMutation,
  useAssignApplicationMutation,
  useMarkApplicationDoneMutation,
  useDecideApplicationMutation,
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetAcademicRecordsQuery,
  useLazyGetAcademicRecordsQuery,
  useGetAcademicRecordsByStudentQuery,
  useGetRecordRoomDashboardQuery,
  useCreateAcademicRecordMutation,
  useUpdateAcademicRecordMutation,
  useDeleteAcademicRecordMutation,
  useGetLettersByStudentQuery,
  useCreateLetterMutation,
  useUpdateLetterMutation,
  useDeleteLetterMutation,
  useGetStaffQuery,
  useGetStaffMemberQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useGetHrDashboardSummaryQuery,
  useGetStaffApplicationsQuery,
  useCreateStaffApplicationMutation,
  useUpdateStaffApplicationMutation,
  useDeleteStaffApplicationMutation,
  useGetStaffLeavesQuery,
  useUpsertStaffLeaveMutation,
  useLazySearchClearanceStudentQuery,
  useGenerateClearanceSlipMutation,
  useVerifyClearanceTokenMutation,
} = api;
