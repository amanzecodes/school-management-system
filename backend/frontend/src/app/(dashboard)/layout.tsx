import React from 'react'
import TeacherLayout from '../components/teacherLayout'

const DashboardLayout = ({ children }: { children: React.ReactNode}) => {
  return (
    <TeacherLayout>
        {children}
    </TeacherLayout>
  )
}

export default DashboardLayout