import React, { useCallback, useEffect, useRef, VFC } from 'react';
import { useParams } from 'react-router';
import useSWR from 'swr';
import gravatar from 'gravatar';
import autosize from 'autosize';
import { Mention,  SuggestionDataItem} from 'react-mentions';

import { ChatArea, EachMention, Form, MentionsTextarea, SendButton, Toolbox, ImgButton } from '@components/ChatBox/styles';
import { IUser } from '@typings/db';
import fetcher from '@utils/fetcher';

interface Props {
  chat: string;
  onSubmitForm: (e: any) => void;
  onChangeChat: (e: any) => void;
  onChangeFile: (e: any) => void;
  placeholder?: string;
}

const ChatBox: VFC<Props> = ({ chat, onSubmitForm, onChangeChat, onChangeFile, placeholder }) => {

  const { workspace } = useParams< {workspace: string} >();
  const { data: userData, error, revalidate, mutate } = useSWR<IUser | false>('/api/users' ,fetcher, {dedupingInterval: 2000});
  const { data: memberData } = useSWR<IUser[]>(userData ? `/api/workspaces/${workspace}/members` : null, fetcher );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if(textareaRef.current){
      autosize(textareaRef.current);
    }
  },[]);
  
  const onKeydownChat = useCallback((e) => {
    //console.log(e);
    if(e.key === 'Enter'){
      if(!e.shiftKey) {
        e.preventDefault();
        onSubmitForm(e);
      }
    }
  },[onSubmitForm]);

  // const onSubmitForm = useCallback(() => {},[]);

   //renderSuggestion F12
  const renderSuggestion = useCallback(
  (
    suggestion: SuggestionDataItem,
    search: string, 
    highlightedDisplay: React.ReactNode, 
    index: number, 
    focus: boolean
  ): React.ReactNode => {
    if (!memberData) return;
    return( //버튼태그
      <EachMention focus={focus}> 
        <img src={gravatar.url(memberData[index].email, { s: '20px', d: 'retro' })} alt={memberData[index].nickname} />
        <span>{highlightedDisplay}</span>
      </EachMention>
    )
  },[memberData]);

  const imageInput = useRef<HTMLInputElement>(null);
  const onClickImageUpload = useCallback(()=> {
    imageInput.current?.click();
  },[imageInput.current]);

  return (
    <ChatArea>
      <Form onSubmit={onSubmitForm}>
        <MentionsTextarea 
          id="editor-chat"
          value={chat} 
          onChange={onChangeChat} 
          onKeyPress={onKeydownChat} 
          placeholder={placeholder} 
          inputRef={textareaRef}
          allowSuggestionsAboveCursor
        >
          <Mention 
            appendSpaceOnAdd 
            trigger="@" 
            data={memberData?.map((v)=> ({ id: v.id, display: v.nickname })) || []} 
            renderSuggestion={renderSuggestion}
          />
        </MentionsTextarea>
        <Toolbox>

          <input type="file" multiple hidden ref={imageInput} onChange={onChangeFile} />
          <ImgButton 
            className="c-button-unstyled c-icon_button c-icon_button--light c-icon_button--size_small c-wysiwyg_container__button" 
            aria-label="파일 첨부" 
            aria-haspopup="menu" 
            aria-expanded="false" 
            data-qa="msg_input_file_btn_inset" 
            data-sk="tooltip_parent" 
            type="button"
            onClick={onClickImageUpload}
          >
              <i className="c-icon c-icon--paperclip" aria-hidden="true"></i>
            </ImgButton>
          
          <SendButton
            className={
              'c-button-unstyled c-icon_button c-icon_button--light c-icon_button--size_medium c-texty_input__button c-texty_input__button--send' +
              (chat?.trim() ? '' : ' c-texty_input__button--disabled')
            }
            data-qa="texty_send_button"
            aria-label="Send message"
            data-sk="tooltip_parent"
            type="submit"
            disabled={!chat?.trim()}
          >
            <i className="c-icon c-icon--paperplane-filled" aria-hidden="true" />
          </SendButton>
        </Toolbox>
      </Form>
    </ChatArea>
  );
};

export default ChatBox;



