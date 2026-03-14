-- Allow task comments to not have a document_id (comments belong to tasks OR documents)
ALTER TABLE comments ALTER COLUMN document_id DROP NOT NULL;
