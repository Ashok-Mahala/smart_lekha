import React, { useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { getStudents } from '../../smlekha/students';
import { Table, Button, Input, Spinner } from '../ui';
import { toast } from 'sonner';

const StudentList = () => {
  const {
    data: students,
    loading,
    error,
    execute: fetchStudents
  } = useApi(getStudents);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Error: {error.message}</p>
        <Button onClick={() => fetchStudents()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Students</h2>
        <div className="flex gap-4">
          <Input
            type="search"
            placeholder="Search students..."
            className="w-64"
          />
          <Button>Add Student</Button>
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Phone</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {students?.data?.map((student) => (
            <Table.Row key={student._id}>
              <Table.Cell>{student.name}</Table.Cell>
              <Table.Cell>{student.email}</Table.Cell>
              <Table.Cell>{student.phone}</Table.Cell>
              <Table.Cell>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    student.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {student.status}
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default StudentList; 