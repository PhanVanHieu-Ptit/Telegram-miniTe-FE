import { useState, useCallback } from "react";
import { Button, Tooltip } from "antd";
import { MessageSquarePlus } from "lucide-react";
import { CreateConversationModal } from "./CreateConversationModal";

/**
 * Trigger component for the Create Conversation flow
 * Displays a button that opens the Creation Modal
 */
export const CreateConversationButton = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const toggleModal = useCallback(() => setModalOpen(prev => !prev), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <>
      <div className="px-3 py-2">
        <Tooltip title="Create new chat or group">
          <Button
            type="primary"
            icon={<MessageSquarePlus className="h-5 w-5 mr-1.5" />}
            onClick={toggleModal}
            className="w-full flex items-center justify-center font-bold h-11 rounded-xl primary-gradient border-none shadow-[0_4px_15px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.4)] transition-all hover:scale-[1.02]"
            size="large"
          >
            Create New Chat
          </Button>
        </Tooltip>
      </div>

      <CreateConversationModal 
        open={modalOpen} 
        onClose={closeModal} 
      />
    </>
  );
};
