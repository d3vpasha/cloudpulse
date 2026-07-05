import ComingSoonPlaceholder from '../../components/common/ComingSoonPlaceholder'

interface ComingSoonPageProps {
  feature: string
}

export default function ComingSoonPage({ feature }: ComingSoonPageProps) {
  return <ComingSoonPlaceholder feature={feature} />
}
