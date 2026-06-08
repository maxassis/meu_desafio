CREATE INDEX "inscription_desafioId_idx" ON "inscription"("desafioId");
CREATE INDEX "tasks_inscriptionId_date_idx" ON "tasks"("inscriptionId", "date");
CREATE INDEX "tasks_inscriptionId_createdAt_idx" ON "tasks"("inscriptionId", "createdAt");
