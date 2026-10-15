<template>
  <div class="about">
    <div class="brand">
      <img class="brandLogo" :src="logoUrl" alt="VideoFlow Logo" />
      <div>
        <h3>VideoFlow</h3>
        <p>视频创作工作台 <span>v{{ appVersion }}</span></p>
      </div>
    </div>
    <el-card shadow="never">
      <a class="repositoryLink" href="https://github.com/xuli-cooly/ai-video" target="_blank" rel="noopener noreferrer">项目仓库</a>
    </el-card>
    <el-card shadow="never">
      <p>本项目基于 Toonflow-app 的 MIT 授权源码开发。</p>
      <a class="repositoryLink" href="https://github.com/HBAI-Ltd/Toonflow-app" target="_blank" rel="noopener noreferrer">查看上游项目</a>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import logoUrl from "@videoflow/assets/videoFlowLogo.svg";

const appVersion = import.meta.env.appVersion;
</script>

<style lang="scss" scoped>
.about {
  display: grid;
  gap: 16px;
  max-width: 640px;

  .brand {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 8px;
  }

  .brandLogo {
    width: 72px;
    height: 72px;
  }

  h3 { margin: 0 0 6px; font-size: 24px; }
  p { margin: 0; color: var(--el-text-color-secondary); }
  .repositoryLink { color: var(--el-color-primary); text-decoration: none; }
  .repositoryLink:hover { text-decoration: underline; }
}
</style>
