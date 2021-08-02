import React, { FC, useCallback } from 'react';
import { useParams } from 'react-router';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useSWR from 'swr';

import { Button, Input, Label } from '@pages/SignUp/styles';
import useInput from '@hooks/useInput';
import { IUser } from '@typings/db';
import fetcher from '@utils/fetcher';
import Modal from '@components/Modal';

interface Props {
  show: boolean;
  onCloseModal: () => void;
  setShowInviteChannelModal: (flag: boolean) => void;
}

toast.configure();
const InviteChannelModal: FC<Props> = ({ show, onCloseModal, setShowInviteChannelModal }) => {
  const { workspace, channel } = useParams<{ workspace: string; channel: string }>();
  const [newMember, onChangeNewMember, setNewMember] = useInput('');
  const { data: userData } = useSWR<IUser>('/api/users', fetcher);
  const { revalidate: revalidateMembers } = useSWR<IUser[]>(
    userData && channel ? `/api/workspaces/${workspace}/channels/${channel}/members` : null, fetcher );

  const onInviteMember = useCallback((e) => {
      e.preventDefault();
      if (!newMember || !newMember.trim()) {
        return alert('초대할 사용자의 아이디를 입력해주시기 바랍니다');
      }
      axios.post(`/api/workspaces/${workspace}/channels/${channel}/members`, { email: newMember })
        .then(() => {
          revalidateMembers();
          setShowInviteChannelModal(false);
          setNewMember('');
        })
        .catch((error) => {
          console.log(error);
          toast.error(error.response?.data, { position: 'bottom-center' });
          setNewMember('');
        });
    }, [newMember]);

  return (
    <Modal show={show} onCloseModal={onCloseModal}>
      <form onSubmit={onInviteMember}>
        <Label id="member-label">
          <span>채널 멤버 초대</span>
          <Input id="member" type="email" value={newMember} onChange={onChangeNewMember} placeholder="abc@naver.com" />
        </Label>
        <Button type="submit">초대하기</Button>
      </form>
    </Modal>
  );
};

export default InviteChannelModal;
