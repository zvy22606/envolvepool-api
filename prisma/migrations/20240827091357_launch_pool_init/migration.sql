-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'ORGANIZATION', 'CONTENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVATED', 'UNACTIVATED');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('JOIN_DISCORD', 'FOLLOW_TWITTER', 'RETWEET_TWITTER', 'INVITATION', 'STAKE_TOKEN');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "uid" SERIAL NOT NULL,
    "email" VARCHAR(100),
    "name" VARCHAR(100),
    "username" VARCHAR(50),
    "nickname" VARCHAR(100),
    "password" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'UNACTIVATED',
    "registerType" VARCHAR(50) NOT NULL DEFAULT 'register',
    "inviteCode" VARCHAR(20) NOT NULL DEFAULT 'ABCDEFGHIJ',
    "invitedBy" VARCHAR(40),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdUser" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "thirdUserId" VARCHAR(50) NOT NULL,
    "thirdUsername" VARCHAR(50),
    "thirdPartyName" VARCHAR(50) NOT NULL,
    "info" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThirdUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaunchProject" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "lowStakingTime" INTEGER NOT NULL,
    "lowStakingAmount" INTEGER NOT NULL,
    "currentStakings" INTEGER NOT NULL DEFAULT 0,
    "totalAirdropAmount" INTEGER NOT NULL,
    "airdropRatio" DOUBLE PRECISION NOT NULL,
    "launchPadID" INTEGER,
    "chainID" INTEGER,
    "fuelStart" TIMESTAMPTZ NOT NULL,
    "allocationStart" TIMESTAMPTZ NOT NULL,
    "airdropStart" TIMESTAMPTZ NOT NULL,
    "airdropEnd" TIMESTAMPTZ NOT NULL,
    "links" JSONB NOT NULL,
    "about" JSONB NOT NULL,
    "video" JSONB NOT NULL,
    "keyMtrics" JSONB NOT NULL,
    "tractions" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "txHash" VARCHAR(255),
    "proof" JSONB,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "LaunchProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaunchWaitList" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "launchProjectId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "LaunchWaitList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLaunchProject" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "launchProjectId" UUID NOT NULL,
    "totalFuel" INTEGER NOT NULL DEFAULT 0,
    "inviteCount" INTEGER NOT NULL DEFAULT 0,
    "invitedBy" UUID,
    "inviteCode" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "UserLaunchProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fuel" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "FuelType" NOT NULL,
    "extra" JSONB,
    "reward" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "launchProjectId" UUID NOT NULL,

    CONSTRAINT "Fuel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFuelTarget" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "launchProjectId" UUID NOT NULL,
    "fuelId" UUID NOT NULL,
    "type" "FuelType" NOT NULL,
    "progress" INTEGER[],
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "completedTime" TIMESTAMPTZ,
    "claimedTime" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "UserFuelTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFuelStake" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "userAddress" VARCHAR(128) NOT NULL,
    "launchProjectId" UUID NOT NULL,
    "launchPadId" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "txHash" VARCHAR(255) NOT NULL,
    "index" INTEGER NOT NULL,
    "amount" DECIMAL(36,18) NOT NULL,
    "fuel" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'stake',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "UserFuelStake_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdUser_userId_thirdPartyName_key" ON "ThirdUser"("userId", "thirdPartyName");

-- CreateIndex
CREATE UNIQUE INDEX "LaunchProject_launchPadID_key" ON "LaunchProject"("launchPadID");

-- CreateIndex
CREATE UNIQUE INDEX "LaunchProject_txHash_key" ON "LaunchProject"("txHash");

-- CreateIndex
CREATE INDEX "UserLaunchProject_userId_idx" ON "UserLaunchProject"("userId");

-- CreateIndex
CREATE INDEX "UserLaunchProject_launchProjectId_idx" ON "UserLaunchProject"("launchProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLaunchProject_userId_launchProjectId_key" ON "UserLaunchProject"("userId", "launchProjectId");

-- CreateIndex
CREATE INDEX "Fuel_launchProjectId_idx" ON "Fuel"("launchProjectId");

-- CreateIndex
CREATE INDEX "UserFuelTarget_userId_idx" ON "UserFuelTarget"("userId");

-- CreateIndex
CREATE INDEX "UserFuelTarget_launchProjectId_idx" ON "UserFuelTarget"("launchProjectId");

-- CreateIndex
CREATE INDEX "UserFuelTarget_fuelId_idx" ON "UserFuelTarget"("fuelId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFuelStake_txHash_key" ON "UserFuelStake"("txHash");
