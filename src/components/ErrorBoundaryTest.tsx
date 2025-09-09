import { useState } from 'react';
import { Button } from 'react-bootstrap';

// Component that can throw an error for testing error boundaries
function ErrorBoundaryTest() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test error for error boundary');
  }

  return (
    <div>
      <Button 
        variant="danger" 
        onClick={() => setShouldThrow(true)}
      >
        Trigger Error (Test Error Boundary)
      </Button>
    </div>
  );
}

export default ErrorBoundaryTest;