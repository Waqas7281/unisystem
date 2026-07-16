export const SIDEBAR_CONFIG = {
  Manager: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Full Student Profile', path: '/full-profile' },
    { label: 'Applications', path: '/applications' },
    { label: 'Fee Detail', path: '/students?mode=fee' },
    { label: 'Students', path: '/students' },
    { label: 'Academic Records', path: '/academic-records' },
    { label: 'Admission Center', path: '/admission-center' },
    { label: 'HR', path: '/hr' },
    { label: 'User Management', path: '/users' },
  ],
  AccountsManager: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Applications', path: '/applications' },
    { label: 'Fee Detail', path: '/students?mode=fee' },
    { label: 'Students', path: '/students' },
  ],
  StudentAffair: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Applications', path: '/applications' },
    { label: 'Fee Detail', path: '/students?mode=fee' },
    { label: 'Students', path: '/students' },
  ],
  DataEntry: [{ label: 'Create Application', path: '/create-application' }],
  RecordRoom: [{ label: 'Academic Records', path: '/academic-records' }],
  // Registrar can view every page in the project.
  Registrar: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Full Student Profile', path: '/full-profile' },
    { label: 'Applications', path: '/applications' },
    { label: 'Fee Detail', path: '/students?mode=fee' },
    { label: 'Students', path: '/students' },
    { label: 'Academic Records', path: '/academic-records' },
    { label: 'Admission Center', path: '/admission-center' },
    { label: 'HR', path: '/hr' },
  ],
  AdmissionCenter: [{ label: 'Admission Center', path: '/admission-center' }],
  HR: [{ label: 'HR', path: '/hr' }],
};

export const ROLE_LABELS = {
  Manager: 'Manager',
  AccountsManager: 'Accounts Manager',
  StudentAffair: 'Student Affair',
  DataEntry: 'Data Entry',
  RecordRoom: 'Record Room',
  Registrar: 'Registrar',
  AdmissionCenter: 'Admission Center',
  HR: 'HR',
};
