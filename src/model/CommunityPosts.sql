CREATE TABLE "CommunityPosts" (
    "PostID" SERIAL PRIMARY KEY,
    "AuthorID" INT NOT NULL REFERENCES "Users"("UserID") ON DELETE CASCADE,
    "ParentPostID" INT REFERENCES "CommunityPosts"("PostID") ON DELETE CASCADE,
    "Title" VARCHAR(255),
    "Content" TEXT NOT NULL,
    "Tags" VARCHAR(255)[], -- Array of tags
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "ExpiresAt" TIMESTAMP GENERATED ALWAYS AS ("CreatedAt" + INTERVAL '10 days') STORED
);

-- Indexes for performance
CREATE INDEX idx_community_posts_author ON "CommunityPosts"("AuthorID");
CREATE INDEX idx_community_posts_parent ON "CommunityPosts"("ParentPostID");
CREATE INDEX idx_community_posts_created ON "CommunityPosts"("CreatedAt");
CREATE INDEX idx_community_posts_expires ON "CommunityPosts"("ExpiresAt");
-- function to remove old posts.
CREATE OR REPLACE FUNCTION clean_expired_posts()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM "CommunityPosts" WHERE "ExpiresAt" < CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clean_expired_posts
AFTER INSERT ON "CommunityPosts"
EXECUTE FUNCTION clean_expired_posts();