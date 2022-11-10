import { ScrollArea } from '@mantine/core';
import { calculateAgeString, formatAddress, formatHumanName } from '@medplum/core';
import { HumanName, Patient, Reference } from '@medplum/fhirtypes';
import { ResourceAvatar, useResource } from '@medplum/react';
import React from 'react';

export interface PatientHeaderProps {
  patient: Patient | Reference<Patient>;
}

export function PatientHeader(props: PatientHeaderProps): JSX.Element | null {
  const patient = useResource(props.patient);
  if (!patient) {
    return null;
  }
  const name = patient.name?.[0] as HumanName;
  const birthDate = patient.birthDate as string;
  const address = patient.address?.[0];
  const email = patient.telecom?.find((t) => t.system === 'email');
  const phone = patient.telecom?.find((t) => t.system === 'phone');

  return (
    <ScrollArea>
      <div>
        <ResourceAvatar value={patient} color={getDefaultColor(patient)} />
        <div>
          <div>
            <strong>Name:</strong> {formatHumanName(name)}
          </div>
          <div>
            <strong>Birth date:</strong> {birthDate} ({calculateAgeString(birthDate)})
          </div>
          {address && (
            <div>
              <strong>Address:</strong> {formatAddress(address)}
            </div>
          )}
          {email && (
            <div>
              <strong>Email:</strong> {email.value}
            </div>
          )}
          {phone && (
            <div>
              <strong>Phone:</strong> {phone.value}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

export function getDefaultColor(patient: Patient): string | undefined {
  if (patient.gender === 'male') {
    return 'blue';
  }
  if (patient.gender === 'female') {
    return 'pink';
  }
  return undefined;
}
