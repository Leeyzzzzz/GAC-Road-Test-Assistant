<script>
export default {
  onLaunch() {
    console.log('路测助手启动');
  },
  onShow() {
    console.log('App Show');
  },
  onHide() {
    console.log('App Hide');
  },
};
</script>

<style>
/* Global Variables */
page {
  --dopamine-orange: #FF8C42;
  --dopamine-pink: #FF6B8B;
  --dopamine-yellow: #F9C74F;
  --dopamine-mint: #43AA8B;
  --dopamine-sky: #4D9DE0;
  --dopamine-purple: #9B5DE5;
  
  --calm-ink: #45495F;
  --calm-mute: #8A8FA6;
  --calm-line: #ECEEF5;

  background: linear-gradient(145deg, #fff8ef 0%, #f8fbff 55%, #fff6fb 100%);
  background-attachment: fixed;
  min-height: 100vh;
  color: var(--calm-ink);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* Base Utility Classes based on 博士工作台 2.0 */
.soft-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 28rpx;
  box-shadow: 0 18rpx 45rpx -22rpx rgba(0, 0, 0, 0.16);
}

.pill {
  border-radius: 999px;
  padding: 8rpx 20rpx;
  font-size: 24rpx;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bg-dopamine-mint-light {
  background-color: rgba(67, 170, 139, 0.1);
}
.text-dopamine-mint {
  color: var(--dopamine-mint);
}

.bg-dopamine-sky-light {
  background-color: rgba(77, 157, 224, 0.1);
}
.text-dopamine-sky {
  color: var(--dopamine-sky);
}

.bg-dopamine-orange-light {
  background-color: rgba(255, 140, 66, 0.1);
}
.text-dopamine-orange {
  color: var(--dopamine-orange);
}

.bg-dopamine-pink-light {
  background-color: rgba(255, 107, 139, 0.1);
}
.text-dopamine-pink {
  color: var(--dopamine-pink);
}

.bg-gradient-primary {
  background: linear-gradient(135deg, var(--dopamine-orange), var(--dopamine-pink));
}

.bg-gradient-secondary {
  background: linear-gradient(135deg, var(--dopamine-sky), var(--dopamine-purple));
}

.shadow-floaty {
  box-shadow: 0 24rpx 60rpx -28rpx rgba(0,0,0,.22);
}
</style>
