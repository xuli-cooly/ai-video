<template>
  <main class="hello" :class="{ configuring: view !== 'welcome' }">
    <div class="pageLanguage"><languageSelect popover /></div>
    <section class="welcomePanel" aria-labelledby="welcomeTitle">
      <div v-if="view !== 'welcome'" class="providerContent">
        <header class="providerHeader">
          <el-button text :icon="IconArrowLeft" @click="view = 'welcome'">返回</el-button>
          <h1 id="welcomeTitle">配置文本模型</h1>
        </header>
        <div class="providerBody"><languageModel /></div>
        <el-button type="primary" :loading="saving" @click="completeSetup">开始创作</el-button>
      </div>
      <div v-else class="welcomeContent">
        <h1 id="welcomeTitle">开始创作</h1>
        <p class="description">先配置你的文本模型中转站；图片和视频中转站可在设置中分别配置。</p>
        <el-button class="loginButton" type="primary" @click="view = 'custom'">
          <icon-key class="buttonIcon" />
          配置文本模型
        </el-button>
        <el-button class="mobileConnectButton" :type="deviceHubEnabled ? 'success' : undefined" :plain="deviceHubEnabled" :icon="deviceHubEnabled || mobileConnection.mode === 'remote' ? IconDeviceDesktop : IconQrcode" @click="mobileConnectVisible = true">{{ mobileConnectionLabel }}</el-button>
        <div class="secondaryActions">
          <el-button class="secondaryButton" round :loading="saving" @click="completeSetup">稍后配置</el-button>
        </div>
      </div>
      <footer class="pageFooter"><p>VideoFlow · 创作工作台</p></footer>
    </section>
    <div class="artPanel" aria-hidden="true">
      <bg class="artBg" />
      <div class="artBrand">
        <span class="artLogo" v-html="logoSvg" />
        <span class="artName">VideoFlow</span>
      </div>
    </div>
    <mobileConnect v-model="mobileConnectVisible" />
  </main>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { IconArrowLeft, IconQrcode, IconDeviceDesktop } from "@tabler/icons-vue";
import { useHelloStore } from "@/stores/hello";
import logoSvg from "@videoflow/assets/videoFlowLogo.svg?raw";
import bg from "./bg.vue";
import languageSelect from "@/components/languageSelect.vue";
import { deviceHubEnabled, mobileConnection, mobileConnectionLabel } from "@/lib/mobile";

const languageModel = defineAsyncComponent(() => import("@/components/settings/panels/languageModel/index.vue"));
const mobileConnect = defineAsyncComponent(() => import("@/components/mobileConnect.vue"));
const mobileConnectVisible = ref(false);
const view = ref<"welcome" | "custom">("welcome");
const saving = ref(false);
const router = useRouter();
const hello = useHelloStore();

async function completeSetup() {
  if (saving.value) return;
  saving.value = true;
  try {
    await hello.complete();
    await router.replace("/home");
  } catch {
    ElMessage.error("保存引导状态失败，请重试");
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.hello {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100svh;
  padding: 8px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-family: "Inter", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;

  .pageLanguage {
    position: fixed;
    top: 16px;
    inset-inline-end: calc(50% + 8px);
    z-index: 2;
    max-width: calc(50% - 24px);
  }

  .welcomePanel {
    display: grid;
    grid-template-rows: 1fr auto 1fr;
    gap: 32px;
    min-width: 0;
    min-height: 544px;
    padding: 48px clamp(24px, 4.4vw, 64px);

    .providerContent {
      grid-row: 1;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      gap: 24px;
      min-width: 0;
      min-height: 0;
      overflow: hidden;

      .providerHeader {
        h1 {
          margin: 16px 0 0;
          font-size: 28px;
          font-weight: 650;
        }
      }

      .providerBody {
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 2px;
      }

      .loginBody {
        min-height: 0;
        overflow-y: hidden;
        overscroll-behavior: contain;
        background-color: #fff;
        border-radius: var(--ui-radius);
        width: 500px;

        .loginFrame {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 640px;
          border: 0;
          background: transparent;
        }
      }

      .loginFeedback {
        display: grid;
        gap: 12px;
      }
    }

    .welcomeContent {
      grid-row: 2;
      width: 100%;
      max-width: 420px;
      text-align: center;

      h1 {
        margin: 0 0 12px;
        font-size: clamp(32px, 3.4vw, 40px);
        font-weight: 650;
        line-height: 1.35;
        letter-spacing: -0.8px;
      }

      .description {
        margin: 0 0 32px;
        color: var(--el-text-color-secondary);
        font-size: 14px;
        line-height: 1.8;
      }

      .buttonIcon {
        width: 18px;
        height: 18px;
        margin-inline-end: 8px;
      }

      .loginButton {
        width: 100%;
        height: auto;
        min-height: 50px;
        padding: 12px;
        white-space: normal;
        border-radius: calc(var(--ui-radius) * 1.625);
        font-size: 16px;
        font-weight: 600;
      }

      .secondaryActions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 20px;

        .separator {
          color: var(--el-text-color-secondary);
          font-size: 13px;
        }

        .secondaryButton {
          height: auto;
          min-height: 36px;
          margin: 0;
          padding: 8px 16px;
          white-space: normal;
          font-size: 13px;
        }
      }

      .mobileConnectButton { width: 100%; margin: 12px 0 0; min-height: 42px; }
    }

    .pageFooter {
      grid-row: 3;
      align-self: end;
      color: var(--el-text-color-secondary);
      font-size: 12px;

      p {
        margin: 10px 0 0;
        line-height: 1.6;
      }
    }
  }

  &.configuring {
    height: 100dvh;
    min-height: 0;
    overflow: hidden;

    .welcomePanel {
      grid-template-rows: minmax(0, 1fr) auto;
      gap: 24px;
      min-height: 0;

      .pageFooter {
        grid-row: 2;
      }
    }
  }

  .artPanel {
    position: relative;
    min-width: 0;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 28px;
    border-radius: calc(var(--ui-radius) * 1.125);
    overflow: hidden;
    background: radial-gradient(ellipse at 76% 82%, #a573ff99 0%, transparent 46%), radial-gradient(ellipse at 25% 52%, #55a8ff99 0%, transparent 52%),
      radial-gradient(ellipse at 90% 18%, #30dfd277 0%, transparent 48%), linear-gradient(145deg, #111c3d, #20254f 58%, #373072);

    .artBg {
      z-index: 0;
    }

    .artBrand {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #fff;

      .artLogo {
        width: 44px;
        height: 44px;
        line-height: 0;

        :deep(svg) {
          display: block;
          width: 100%;
          height: 100%;
        }

      }

      .artName {
        font-size: 30px;
        font-weight: 600;
        letter-spacing: 0.4px;
      }
    }
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;

    .pageLanguage {
      inset-inline-end: 16px;
      max-width: calc(100% - 32px);
    }

    .welcomePanel {
      padding: 32px 20px;

      .welcomeContent {
        justify-self: center;
      }
    }

    .artPanel {
      display: none;
    }
  }
}
</style>
