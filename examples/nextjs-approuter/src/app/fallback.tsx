'use server';

import React from 'react';

export default async function Fallback() {
  return <p style={{ color: 'red' }}>Oops, there was an error.</p>;
}
