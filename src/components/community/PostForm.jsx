import React from 'react';

function PostForm({ onSubmit }) {
    return (
        <form className="post-form" onSubmit={onSubmit}>
            {/* 게시글 작성 폼 내용 */}
            <div className="form-placeholder">게시글 작성 폼</div>
        </form>
    );
}

export default PostForm;