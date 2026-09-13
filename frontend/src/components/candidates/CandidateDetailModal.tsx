import React from 'react';
import { Modal } from '../common/Modal.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CandidateDetailModal: React.FC<Props> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Candidate Profile Detail">
      <div>
        <h4>Alex Johnson</h4>
        <p>Senior Full Stack Engineer</p>
      </div>
    </Modal>
  );
};
