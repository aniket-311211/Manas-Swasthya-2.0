import React from "react";
import SvasthyaJournal from "@/components/journal/SvasthyaJournal";

const Journal: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pt-20">
      <SvasthyaJournal />
    </div>
  );
};

export default Journal;
