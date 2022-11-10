import { Button, Modal } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { createReference, normalizeErrorString } from '@medplum/core';
import { Practitioner, Resource, Task } from '@medplum/fhirtypes';
import { Form, ResourceInput, useMedplum } from '@medplum/react';
import React, { useState } from 'react';

export interface ReassignDialogProps {
  task?: Task;
  onOk: () => void;
  onCancel: () => void;
}

export function ReassignDialog(props: ReassignDialogProps): JSX.Element | null {
  const medplum = useMedplum();
  const [assignee, setAssignee] = useState<Resource>();
  if (!props.task) {
    return null;
  }

  function onOk(): void {
    medplum
      .updateResource({
        ...(props.task as Task),
        owner: createReference(assignee as Practitioner),
      })
      .then(() => showNotification({ color: 'green', message: 'Task reassigned' }))
      .then(() => props.onOk())
      .catch((err) => showNotification({ color: 'red', message: normalizeErrorString(err) }));
  }

  return (
    <Modal title="Reassign Task" opened={true} onClose={props.onCancel}>
      <div style={{ width: 500, padding: '20px 50px' }}>
        <Form onSubmit={onOk}>
          <ResourceInput resourceType="Practitioner" name="assignee" onChange={setAssignee} />
          <Button type="submit">Reassign</Button>
        </Form>
      </div>
    </Modal>
  );
}
