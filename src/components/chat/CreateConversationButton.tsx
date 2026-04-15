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
            className="w-full flex items-center justify-center font-bold h-12 rounded-xl mesh-btn shadow-lg transition-all"
            size="large"
          >
            START CHAT
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
