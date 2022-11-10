import { Button, Group, Table } from '@mantine/core';
import { formatGivenName } from '@medplum/core';
import { HumanName, Patient, Practitioner, Reference, Task } from '@medplum/fhirtypes';
import { Document, ResourceBadge, StatusBadge, useMedplum, useMedplumProfile } from '@medplum/react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReassignDialog } from './ReassignDialog';
import { getTaskActions, getTaskType } from './utils';

export function HomePage(): JSX.Element {
  const navigate = useNavigate();
  const medplum = useMedplum();
  const profile = useMedplumProfile() as Practitioner;
  const [reassignTask, setReassignTask] = useState<Task>();
  const tasks = medplum.searchResources('Task', '_sort=patient').read();

  return (
    <>
      <Document width={1200}>
        <h1>Welcome {formatGivenName(profile.name?.[0] as HumanName)}</h1>
        <Table>
          <tbody>
            {tasks.map((task, taskIndex) => (
              <tr key={task.id}>
                {isPatientVisible(tasks, taskIndex) && (
                  <td rowSpan={getPatientRowSpan(tasks, taskIndex)} style={{ verticalAlign: 'top', paddingTop: 10 }}>
                    <ResourceBadge value={task.for as Reference<Patient>} />
                  </td>
                )}
                <td>{getTaskType(task)}</td>
                <td>{task.description}</td>
                <td>
                  <StatusBadge status={task.status as string} />
                  {task.priority && <StatusBadge status={task.priority as string} />}
                </td>
                <td>
                  <Group spacing="xs">
                    {getTaskActions(task).map((action, actionIndex) => (
                      <Button
                        key={`action-${actionIndex}`}
                        size="xs"
                        variant="outline"
                        onClick={() => navigate(action.href)}
                      >
                        {action.label}
                      </Button>
                    ))}
                    <Button size="xs" variant="outline" onClick={() => setReassignTask(task)}>
                      Reassign
                    </Button>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Document>
      <ReassignDialog
        task={reassignTask}
        onOk={() => setReassignTask(undefined)}
        onCancel={() => setReassignTask(undefined)}
      />
    </>
  );
}

function isPatientVisible(tasks: Task[], index: number): boolean {
  return index === 0 || tasks[index].for?.reference !== tasks[index - 1].for?.reference;
}

function getPatientRowSpan(tasks: Task[], index: number): number {
  let count = 1;
  for (let i = index + 1; i < tasks.length; i++) {
    if (tasks[i].for?.reference === tasks[index].for?.reference) {
      count++;
    } else {
      break;
    }
  }
  return count;
}
