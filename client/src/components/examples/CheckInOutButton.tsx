import { CheckInOutButton } from '../CheckInOutButton';

export default function CheckInOutButtonExample() {
  const mockLastAction = {
    type: "check-in" as const,
    timestamp: "Today, 9:00 AM",
    location: "Office Building A"
  };

  return (
    <div className="p-4 space-y-6 bg-background">
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
        <CheckInOutButton
          type="check-in"
          onAction={(type, location) => {
            console.log(`${type} action with location:`, location);
          }}
          lastAction={mockLastAction}
        />
        <CheckInOutButton
          type="check-out"
          onAction={(type, location) => {
            console.log(`${type} action with location:`, location);
          }}
        />
      </div>
    </div>
  );
}