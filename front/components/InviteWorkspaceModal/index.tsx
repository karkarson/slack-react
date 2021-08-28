import React, { FC, useCallback } from 'react';
import { useParams } from 'react-router';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useSWR from 'swr';

import Modal from '@components/Modal';
import useInput from '@hooks/useInput';
import { Button, Input, Label } from '@pages/SignUp/styles';
import { IUser } from '@typings/db';
import fetcher from '@utils/fetcher';

interface Props {
  show: boolean;
  onCloseModal: () => void;
  setShowInviteWorkspaceModal: (flag: boolean) => void;
}
toast.configure();

const InviteWorkspaceModal: FC<Props> = ({ show, onCloseModal, setShowInviteWorkspaceModal }) => {
  
  const { workspace } = useParams<{ workspace: string; channel: string }>();
  const [newMember, onChangeNewMember, setNewMember] = useInput('');
  const { data: userData } = useSWR<IUser>('/api/users', fetcher);
  const { revalidate: revalidateMember } = useSWR<IUser[]>(
    userData ? `/api/workspaces/${workspace}/members` : null, fetcher );

  const onInviteMember = useCallback((e) => {
      e.preventDefault();
      if (!newMember || !newMember.trim()) {
        return alert('초대할 사용자의 아이디를 입력해주시기 바랍니다');
      }
      axios.post(`/api/workspaces/${workspace}/members`, { email: newMember }, {withCredentials: true})
        .then((response) => {
          revalidateMember();
          setShowInviteWorkspaceModal(false);
          setNewMember('');
        })
        .catch((error) => {
          console.dir(error);
          toast.error(error.response?.data, { position: 'bottom-center' });
          setNewMember('');
        });
    }, [workspace, newMember]);

  return (
    <Modal show={show} onCloseModal={onCloseModal}>
      <form onSubmit={onInviteMember}>
        <Label id="member-label">
          <span>이메일</span>
          <Input id="member" type="email" value={newMember} onChange={onChangeNewMember} placeholder="abc@naver.com"/>
        </Label>
        <Button type="submit">초대하기</Button>
      </form>
    </Modal>
  );
};

export default InviteWorkspaceModal;
